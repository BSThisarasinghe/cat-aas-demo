var argv = require('minimist')(process.argv.slice(2));
const fetch = require('node-fetch');
let { writeFile } = require('fs');
let { join } = require('path');
const mergeImages = require('merge-images');
const moment = require('moment');
const { Canvas, Image } = require('canvas');
const util = require('util');
require('dotenv').config();

const writeFileAsync = util.promisify(writeFile);

let {
    greeting = "Hello",
    who = "You",
    width = 400,
    height = 500,
    color = "Pink",
    size = 100,
  } = argv;

const getImages = async (urls) => {
    const promises = urls.map((url) => getImage(url));
    return await Promise.all(promises);
};

const writeImageFile = async (joinedImages) => {
    const fileName = join(process.cwd(), 'merged-image-' + moment().format('YYYYMMDDhhmmss') + '.png');
    console.log('fileName ' + fileName);
    const base64result = joinedImages.split(',')[1];

    try {
        await writeFileAsync(fileName, base64result, 'base64');
        console.log('The file was saved!');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function getImageBind(req, res) {
    const imageUrls = [
        `${process.env.API_URL}/${greeting}?width=${width}&height=${height}&color=${color}&s=${size}`,
        `${process.env.API_URL}/${who}?width=${width}&height=${height}&color=${color}&s=${size}`
    ];
    try {
        const imageResponses = await getImages(imageUrls); // loop through all image urls and return images

        const joinedImages = await joinImages(...imageResponses); // merge images

        writeImageFile(joinedImages); // write image into file

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function joinImages(...imageResponses) {
    let imageArray = [];

    for (const [i, response] of imageResponses.entries()) {
        let image = "data:image/jpeg;base64," + response.toString('base64'); // loop through all image responses
        imageArray.push({ src: image, x: width * i, y: 0 }); // define image locations for new image
    }

    return mergeImages(imageArray, { // merge images
        Canvas: Canvas,
        Image: Image,
        width: width * imageResponses.length,
        height: height
    });
}

async function getImage(url) {
    console.log('fetch image' + url);
    try {
        const response = await fetch(url); // fetch images
        return response.buffer();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

getImageBind();