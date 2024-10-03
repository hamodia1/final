from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import io
import os
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use Agg backend for non-interactive plotting
from pulp import LpProblem, LpMinimize, LpVariable, lpSum, value

app = Flask(__name__)

# Ensure the directory for charts exists
CHARTS_DIR = 'charts'
if not os.path.exists(CHARTS_DIR):
    os.makedirs(CHARTS_DIR)

# Function to clear the plots directory
def clear_plots_directory():
    for filename in os.listdir(CHARTS_DIR):
        file_path = os.path.join(CHARTS_DIR, filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)  # Remove file
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
@app.route('/upload-csvs', methods=['POST'])
def upload_csvs():
    clear_plots_directory()

    if 'last_req' not in request.files or 'assigned_shifts' not in request.files:
        return jsonify({'error': 'Please upload both CSV files.'}), 400

    last_req_file = request.files['last_req']
    assigned_shifts_file = request.files['assigned_shifts']

    try:
        # Load the CSV files
        last_req_data = pd.read_csv(last_req_file)
        best_data = pd.read_csv(assigned_shifts_file)
        
        # Clean last_req_data
        last_req_data = last_req_data[last_req_data['time_begin'] != 'time_begin']  # Remove duplicated header rows
        last_req_data['time_end'] = last_req_data['time_end'].replace("24:00", "23:59")
        last_req_data['time_begin'] = pd.to_datetime(last_req_data['time_begin'], errors='coerce').dt.time
        last_req_data['time_end'] = pd.to_datetime(last_req_data['time_end'], errors='coerce').dt.time

        # Clean best_data
        best_data = best_data[best_data['time_begin'] != 'time_begin']  # Remove duplicated header rows
        best_data['time_end'] = best_data['time_end'].replace("24:00", "23:59")
        best_data['time_begin'] = pd.to_datetime(best_data['time_begin'], errors='coerce').dt.time
        best_data['time_end'] = pd.to_datetime(best_data['time_end'], errors='coerce').dt.time

        # Fill NaT values
        best_data['time_begin'].fillna(pd.to_datetime("00:00").time(), inplace=True)
        best_data['time_end'].fillna(pd.to_datetime("23:59").time(), inplace=True)
        last_req_data['time_begin'].fillna(pd.to_datetime("00:00").time(), inplace=True)
        last_req_data['time_end'].fillna(pd.to_datetime("23:59").time(), inplace=True)

        # List all unique skills and days
        all_skills = last_req_data['skill'].unique()
        all_days = last_req_data['day'].unique()

        # Function to plot both skill requirements and shift coverage for each skill and day
        def plot_mixed_shift_and_requirements(skill, day, skill_data_req, skill_data_best, save_path):
            # Filter data for the specific day and skill
            day_skill_req = skill_data_req[(skill_data_req['day'] == day) & (skill_data_req['skill'] == skill)]
            day_skill_best = skill_data_best[(skill_data_best['day'] == day) & (skill_data_best['skill'] == skill)]

            # Create a time range from 7:00 to 23:59 in 30-minute intervals
            time_range = pd.date_range('07:00', '23:59', freq='30min').time

            # Process skill requirements
            skill_req_full = pd.DataFrame(time_range, columns=['time_begin'])
            skill_req_full = skill_req_full.merge(day_skill_req, on='time_begin', how='left')
            skill_req_full['require'] = skill_req_full['require'].fillna(0)

            # Process shift coverage
            coverage_data = pd.DataFrame(time_range, columns=['Time'])
            coverage_data['Requirement'] = 0
            for _, row in day_skill_best.iterrows():
                from_time = row['time_begin']
                to_time = row['time_end']
                Requirement = row['require']
                coverage_data.loc[(coverage_data['Time'] >= from_time) & (coverage_data['Time'] < to_time), 'Requirement'] += Requirement

            # Ensure the step plot is smooth by duplicating points before jumps
            expanded_time = []
            expanded_requirement = []
            for i in range(len(coverage_data) - 1):
                expanded_time.append(coverage_data['Time'].iloc[i])
                expanded_requirement.append(coverage_data['Requirement'].iloc[i])
                expanded_time.append(coverage_data['Time'].iloc[i + 1])
                expanded_requirement.append(coverage_data['Requirement'].iloc[i])

            # Final point to 23:59
            if coverage_data['Time'].iloc[-1] < pd.to_datetime('23:59').time():
                expanded_time.append(pd.to_datetime('23:59').time())
                expanded_requirement.append(0)

            # Plot the mixed chart
            plt.figure(figsize=(12, 6))

            # Plot shift coverage
            plt.step([str(t) for t in expanded_time], expanded_requirement, where='post', color='blue', label='Shift Coverage', alpha=0.5)
            plt.fill_between([str(t) for t in expanded_time], expanded_requirement, color='blue', alpha=0.3)

            # Plot skill requirements
            plt.step(skill_req_full['time_begin'].astype(str), skill_req_full['require'], where='post', marker='o', color='red', label='Skill Requirements')

            # Chart labeling
            plt.xticks(rotation=90)
            plt.xlabel('Time (hours)')
            plt.ylabel('Number of Employees')
            plt.title(f'Shift Coverage and Skill Requirements for {skill} on {day}')
            plt.grid(True)
            plt.legend()
            plt.tight_layout()

            # Save the chart
            plt.savefig(save_path)
            plt.close()  # Close the plot to avoid display

        # Loop through each day and skill, and generate the mixed plots
        output_dir = 'plots'  # Directory to save plots
        os.makedirs(output_dir, exist_ok=True)  # Create directory if it doesn't exist

        plot_paths = []  # List to hold the paths of the generated plots
        for day in all_days:
            for skill in all_skills:
                save_path = os.path.join(output_dir, f'{skill}_{day}.png')  # Specify the filename for saving the plot
                plot_mixed_shift_and_requirements(skill, day, last_req_data, best_data, save_path)
                plot_paths.append(save_path)  # Add the path to the list

        return jsonify({'message': 'Plots generated successfully!', 'plot_directory': output_dir, 'plot_paths': plot_paths}), 200

    except Exception as e:
        print(f"Error during processing: {e}")
        return jsonify({'error': str(e)}), 500



@app.route('/optimize-schedule', methods=['POST'])
def optimize_schedule():
    try:
        # Read the CSV files from the request
        req_shifts_csv = request.files['req_shifts'].read().decode('utf-8')
        shifts_csv = request.files['shifts'].read().decode('utf-8')

        # Convert CSV to Pandas DataFrames
        req_shifts = pd.read_csv(io.StringIO(req_shifts_csv))
        shifts = pd.read_csv(io.StringIO(shifts_csv))

        # Perform optimization
        prob = LpProblem("Shift Optimization", LpMinimize)

        # Define decision variables (bounded by 7 as max number of employees per shift)
        x = [LpVariable(f"x_{i}", lowBound=0, upBound=7, cat='Integer') for i in range(len(shifts))]

        # Objective function: Minimize total cost
        prob += lpSum([x[i] * shifts.iloc[i]['price'] for i in range(len(shifts))]), "Total_Cost"

        # Constraints: Match shift requirements
        for _, req in req_shifts.iterrows():
            matching_shifts = shifts[
                (shifts['skill'] == req['skill']) &
                (shifts['day'] == req['day']) &
                (shifts['time_begin'] <= req['time_begin']) &
                (shifts['time_end'] >= req['time_end'])
            ]
            prob += lpSum([x[shifts.index.get_loc(shift.name)] for _, shift in matching_shifts.iterrows()]) >= req['require']

        # Solve the optimization problem
        prob.solve()

        # Prepare the solution
        solution = pd.DataFrame({
            'Skill': shifts['skill'],
            'Day': shifts['day'],
            'From Hour': shifts['time_begin'],
            'To Hour': shifts['time_end'],
            'Shift Cost': shifts['price'],
            'Requirement': [value(x[i]) for i in range(len(shifts))]  # Solution values
        })

        # Convert the solution DataFrame to CSV format
        solution_csv = solution.to_csv(index=False)


        # Return the CSV as a response
        return jsonify({
            'status': 'success',
            'solution': solution_csv
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/plots/<path:filename>')
def serve_plot(filename):
    return send_from_directory('plots', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)  # Adjust the port as needed
