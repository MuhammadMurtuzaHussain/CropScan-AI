import React, { useState } from 'react';
import Header from './Header';
import ImageUpload from './ImageUpload';
import Results from './Results';
import '../styles/App.css';

const App = () => {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);

    const handleImageUpload = (uploadedImage) => {
        setImage(uploadedImage);
    };

    const handleResult = (analysisResult) => {
        setResult(analysisResult);
    };

    return (
        <div className="app-container">
            <Header />
            <ImageUpload onImageUpload={handleImageUpload} onResult={handleResult} />
            <Results image={image} result={result} />
        </div>
    );
};

export default App;