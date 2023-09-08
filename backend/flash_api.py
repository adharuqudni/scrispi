import json
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import base64
from tensorflow.keras.applications.vgg16 import decode_predictions

app = Flask(__name__)
# Load your pre-trained TensorFlow model here
# Replace 'model_path' with the actual path to your model's weights and architecture
model_path = './vgg16_fine_tuned_twilight.h5'
model = tf.keras.models.load_model(model_path)
CORS(app)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg'}


# Function to check if a file has an allowed extension

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def pre_func(image):
    # Convert the float image to an 8-bit grayscale image
    resized_image = cv2.resize(image, (224, 224))
    gray_image = cv2.cvtColor(np.array(resized_image), cv2.COLOR_BGR2GRAY).astype(np.uint8);

    clahe = cv2.createCLAHE(clipLimit=200.0, tileGridSize=(8, 8))
    claheImage = clahe.apply(gray_image)

    color = cv2.applyColorMap(claheImage, cv2.COLORMAP_TWILIGHT_SHIFTED)

    return  gray_image.astype(np.float64), claheImage.astype(np.float64), color.astype(np.float64)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        response_images = []
        if 'image' not in request.files:
            raise Exception("No image part")

        file = request.files['image']

        # Check if the file has an allowed extension
        if file.filename == '':
            raise Exception("No selected file")

        if not allowed_file(file.filename):
            raise Exception("Invalid file format. Allowed extensions are jpg, jpeg.")

        # Read the uploaded image into memory
        file_data = file.read()
        nparr = np.frombuffer(file_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_results = pre_func(image)
        image_predict = np.expand_dims(image_results[2], axis=0)
        prediction = model.predict(image_predict)
        predicted_labels = np.argmax(prediction, axis=1)
        for image in image_results:
            buffered_image = io.BytesIO()
            Image.fromarray(np.uint8(image)).save(buffered_image, format="JPEG")
            base64_image = base64.b64encode(buffered_image.getvalue()).decode("utf-8")
            response_images.append(base64_image)

        print(response_images)

        response_data = {
            "predictions": str(predicted_labels[0]),
            "confident": str(prediction[0][predicted_labels[0]]),
            "images": response_images,
            "message": "Predictions successfully generated."
            # Add any other data you want to include in the response JSON
        }

        # Return the response dictionary as JSON
        return jsonify(response_data), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def health():
    check = {
        'health': 'oke'
    }
    return jsonify(check), 200


app.run()
