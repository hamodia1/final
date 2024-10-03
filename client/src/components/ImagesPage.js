import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/ImagesPage.css'; // For styling

const ImagesPage = () => {
  const [images, setImages] = useState([]); // State to hold the image URLs
  const [message, setMessage] = useState(''); // State for messages
  const [selectedImage, setSelectedImage] = useState(null); // State to handle full-size image display

  // Fetch images from the server
  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve the token from local storage
  
      const response = await axios.get('http://localhost:8383/get-images', {
        headers: {
          'Authorization': `Bearer ${token}` // Include the token in the Authorization header
        }
      });
  
      if (Array.isArray(response.data)) {
        setImages(response.data); // Set images if data is an array
      } else {
        setMessage('Unexpected response format.');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setMessage('Failed to load images.');
    }
  };

  // Handle opening the image in full size
  const openImage = (image) => {
    setSelectedImage(image);
  };

  // Handle closing the full-size image view
  const closeImage = () => {
    setSelectedImage(null);
  };

  // Function to extract just the image name from the path and remove the file extension
  const extractImageName = (path) => {
    const imageNameWithExtension = path.split('/').pop(); // Get the last part of the path
    return imageNameWithExtension.replace(/\.[^/.]+$/, ''); // Remove the file extension
  };

  useEffect(() => {
    fetchImages(); // Fetch images when component mounts
  }, []);

  return (
    <div className="images-page-container">
      <h1>Charts</h1>
      {message && <p className="error-message">{message}</p>}
      
      <div className="image-gallery">
        {images.length === 0 ? (
          <p>No images to display.</p>
        ) : (
          images.map((image, index) => (
            <div key={index} className="image-container">
              <img 
                src={`http://localhost:5001/${image.path}`} 
                alt={`Image ${index}`} 
                className="image" 
                onClick={() => openImage(`http://localhost:5001/${image.path}`)} // Open image on click
              />
              <p>{extractImageName(image.path)}</p> {/* Display the image name without extension */}
            </div>
          ))
        )}
      </div>

      {/* Full-size image display */}
      {selectedImage && (
        <div className="modal" onClick={closeImage}>
          <span className="close">&times;</span>
          <img className="modal-content" src={selectedImage} alt="Full-size" />
        </div>
      )}
    </div>
  );
};

export default ImagesPage;
