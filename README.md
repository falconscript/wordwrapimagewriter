# wordwrapimagewriter

> ES6 JS class to write text onto image with word wrapping

## Installation

```sh
npm install wordwrapimagewriter --save
```

## Usage

Write lines onto an image wrapping and automatically determining  
spacing and padding as specified

```js
// Instantiate the writer
var writer = new wordwrapimagewriter({
  imgFilename: './imageToWriteOnto.png',
  availableLines: 3, // your maximum line number you allow
  topPadPx: 50, // spacing from top of image to move down before writing
  lineBottomPadPx: 5, // spacing at bottom of each line
  fontFile: './HelveticaBold.ttf',
});

// Call open to asynchronously load image before writing
writer.openImg(() => {
  // The color declarations are from the node-gd package in rgba format
  var usernameColor = writer.img.colorAllocateAlpha(255, 20, 20, 1);
  var textColor = writer.img.colorAllocateAlpha(255, 255, 255, 1);
  var usernameText = "jenk37: ";
  var messageText = "I think that the wordwrapimagewriter is pretty good";

  // Write text onto the image. If the text takes more more lines
  // than availableLines, it will return the text that did not fit.
  var textThatWontFit = writer.writeText(usernameText, usernameColor);

  if (textThatWontFit) {
    console.log("[!] Text couldn't fit:", textThatWontFit);
  }

  // Change font or size. Changing size will automatically update lineLength
  writer.setFontSize(30);
  writer.setFont('./Helvetica.ttf');

  textThatWontFit = writer.writeText(messageText, textColor);

  if (textThatWontFit) {
    console.log("[!] Text couldn't fit:", textThatWontFit);
  }

  // Save the image file
  writer.save("./newImageFilename.png", () => {
    return callback();
  });
});


```

## Credits
http://x64projects.tk/
