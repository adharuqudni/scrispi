import { NextPage } from "next";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Image from "next/image";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import axios from "axios";

const b64toBlob = (b64Data: string, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const VisuallyHiddenInput = styled("input")`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

const preprocess = ["grayscale", "clahe", "pseudocoloring"];

const lungsClass = ["covid-19", "normal","pneumonia",  "tubercolosis"];

const Index: NextPage = () => {
  const [value, setValue] = useState("1");
  const [image, setImage] = useState("");
  const [images, setImages] = useState([]);
  const [predict, setPredict] = useState(-1);
  const [confident, setConfident] = useState(-1.0);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleInputFile = async (e) => {
    const imageFile = e.target.files[0];
    console.log(imageFile)
    setImage(imageFile);
    try {
      const url = "http://localhost:5000/predict";
      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await axios.post(url, formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      });
      const { images, message, predictions, confident } = await response.data;
      const blobImages = images.map((image) => b64toBlob(image));
      setImages(blobImages);
      setPredict(parseInt(predictions));
      setConfident(parseFloat(confident))
      console.log(images, message, predictions);
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Deteksi Penyakit Paru-Paru
          </Typography>
        </Toolbar>
      </AppBar>
      <div className="p-10 flex flex-row w-full gap-10">
        <div className="upload-section flex flex-col w-full">
          {image == "" ? (
            <div className="self-center" style={{ height: 500 }}>
              <Typography
                gutterBottom
                variant="h5"
                component="div"
                className="inline-block"
              >
                Please Insert Image First
              </Typography>
            </div>
          ) : (
            <Image
              src={URL.createObjectURL(image)}
              width={500}
              height={500}
              alt="Picture of the author"
              className="m-4 self-center"
            />
          )}
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            href="#file-upload"
          >
            Upload a file
            <VisuallyHiddenInput onInput={handleInputFile} type="file" />
          </Button>
        </div>
        <div className="detail-section flex flex-col w-full">
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList
                onChange={handleChange}
                aria-label="lab API tabs example"
              >
                {preprocess.map((val, index) => (
                  <Tab key={index} label={val} value={index.toString()} />
                ))}
              </TabList>
            </Box>
            {preprocess.map((val, index) => (
              <TabPanel key={val} value={index.toString()}>
                <Card>
                  {images.length > 2 ? (
                    <Image
                      src={URL.createObjectURL(images[index])}
                      width={500}
                      height={500}
                      alt="Picture of the author"
                      className="m-4 self-center"
                    />
                  ) : (
                    <div className="self-center p-5" style={{ height: 350 }}>
                      <Typography
                        gutterBottom
                        variant="h5"
                        component="div"
                        className="inline-block"
                      >
                        Please Insert Image First
                      </Typography>
                    </div>
                  )}
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h6"
                      color="primary"
                      component="div"
                    >
                      {image !== '' ? image.name : 'File name'}
                    </Typography>
                    <Typography gutterBottom variant="h5" component="div">
                      {predict != -1 ? lungsClass[predict].toUpperCase() : 'Kelas Citra'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lizards are a widespread group of squamate reptiles, with
                      over 6,000 species, ranging across all continents except
                      Antarctica
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <div className="bg-gray-200 pl-3 pr-1 py-1 rounded-full flex flex-row gap-2">
                      <Typography
                        className="self-center"
                        variant="body1"
                        color="text.secondary"
                      >
                        Confident
                      </Typography>
                      <Chip className="p-0" label={confident == -1 ? "???%" : `${confident*100}%`}color="primary" />
                    </div>
                  </CardActions>
                </Card>
              </TabPanel>
            ))}
          </TabContext>
        </div>
      </div>
    </div>
  );
};

export default Index;
