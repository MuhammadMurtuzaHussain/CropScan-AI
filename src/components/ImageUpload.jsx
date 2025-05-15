import React, { useState } from 'react';
import { analyzeCropImage } from '../services/aiService';
import '../styles/ImageUpload.css';

const ImageUpload = ({ onImageUpload, onResult }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(URL.createObjectURL(file));
            onImageUpload(URL.createObjectURL(file));
            
            try {
                setIsLoading(true);
                setError(null);
                const result = await analyzeCropImage(file);
                onResult(result.status);
            } catch (err) {
                setError('Failed to analyze image. Please try again.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="upload-container">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                id="file-input"
            />
            <label htmlFor="file-input" className="upload-button">
                Choose an Image
            </label>
            {isLoading && <div className="loading">Analyzing image...</div>}
            {error && <div className="error">{error}</div>}
            {selectedImage && (
                <div className="image-preview">
                    <img src={selectedImage} alt="Selected crop" />
                </div>
            )}
        </div>
    );
};

export default ImageUpload;