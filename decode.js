/**
 * Decode image and extract message embedded in the image.
 */
(function () {

  'use strict';

  var Buffer = require('buffer').Buffer,
    fs = require('fs'),
    process = require('process'),
    spawn = require('child_process').spawn,
    util = require('util'),

    gmPath = 'C:\\Program Files\\GraphicsMagick-1.3.21-Q8\\gm.exe',

    sourceFile = 'C:\\Users\\alext\\Downloads\\test\\altered.png',
    intermediateFile = 'C:\\Users\\alext\\Downloads\\test\\altered-decode.rgb',

    intermediateFileSize = 0,

    pixelsBuffer = null,

    message = '',

    getRGBFileStats = null,
    getRGBFileBytes = null,
    processRGBFileBytes = null,
    printRetrievedMessage = null;

  /**
   * Gets RGB file statistics.
   */
  getRGBFileStats = function () {
    fs.stat(intermediateFile, function (statError, stats) {
      if (statError !== null) {
        console.error('Unable to get intermediate file statistics.');
        console.error(statError);
        process.exit(1);
        return;
      }
      intermediateFileSize = stats.size;
      process.nextTick(getRGBFileBytes);
    });
  };

  /**
   * Gets content, in bytes, of the RGB file.
   */
  getRGBFileBytes = function () {
    fs.open(intermediateFile, 'r', function (openError, fileDescriptor) {
      pixelsBuffer = new Buffer(intermediateFileSize);
      if (openError !== null) {
        console.error('Unable to open intermediate file.');
        console.error(openError);
        process.exit(1);
      }
      fs.read(
        fileDescriptor,
        pixelsBuffer,
        0,
        intermediateFileSize,
        null,
        function (readError) {
          if (readError !== null) {
            console.error('Unable to read intermediate file.');
            console.error(readError);
            process.exit(1);
            return;
          }
          process.nextTick(processRGBFileBytes);
        }
      );
    });
  };

  /**
   * Processes data bytes from the RGB file.
   */
  processRGBFileBytes = function () {
    var pixelIndex = 0,
      pixelByteIndex = 0,
      redValueOffset = 0,
      greenValueOffset = redValueOffset + 1,
      blueValueOffset = greenValueOffset + 1,
      pixelsBufferLength = pixelsBuffer.length,
      redValue = 0,
      greenValue = 0,
      blueValue = 0,
      retrievedCharacter = null;
    while (pixelByteIndex < pixelsBufferLength) {
      redValue = pixelsBuffer.readUInt8(pixelByteIndex + redValueOffset);
      greenValue = pixelsBuffer.readUInt8(pixelByteIndex + greenValueOffset);
      blueValue = pixelsBuffer.readUInt8(pixelByteIndex + blueValueOffset);
      console.log(util.format('Pixel %d', pixelIndex));
      console.log(util.format('R: %d', redValue));
      console.log(util.format('G: %d', greenValue));
      console.log(util.format('B: %d', blueValue));
      redValue = redValue & 0b00000111;
      greenValue = greenValue & 0b00000111;
      blueValue = blueValue & 0b00000011;
      retrievedCharacter =
        String.fromCharCode((redValue << 5) + (greenValue << 2) + blueValue);
      message += retrievedCharacter;
      pixelIndex += 1;
      pixelByteIndex += 3;
    }
    process.nextTick(printRetrievedMessage);
  };

  /**
   * Prints the message retrieved from the image.
   */
  printRetrievedMessage = function () {
    console.log('Retrieved the following message:');
    console.log(message);
    process.exit(0);
  };

  (function () {
    var commandArguments = [
        'convert',
        sourceFile,
        intermediateFile
      ],
      gm = spawn(gmPath, commandArguments);
    gm.on('error', function (error) {
      console.error('Unable to convert image.');
      console.error(error);
      process.exit(1);
    });
    gm.on('close', function (code) {
      if (code !== 0) {
        console.error(util.format('GraphicsMagick exit with code %d.', code));
        process.exit(1);
        return;
      }
      process.nextTick(getRGBFileStats);
    });
  }());
}());
