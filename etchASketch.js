
const SKETCH_WIDTH = 900
const PIXEL_CLASS = 'sketch-pixel'
const MAX_SKETCH_SIZE = 200 // larger numbers will have significant performance issues

// script local variables required for operation
let sysVars = {
  sketchSize: 40,   // default 40x40 grid
  sketchDOM: null,  // initialized in setup
  colorizerMethod: 2,
  hsvControlsDOM: null,
  hsv_s: 1,
  hsv_v: 1,
}

// Colorizer methods, order in this list changes the order in the UI menu.
const COLORIZER_METHODS = {
  "Darken": 2,
  "Lighten": 3,
  "Classic Random": 0,
  "HSV Random": 1,
}

/**
 * Creates a sketch of square 'pixels' created out of empty div elements.
 * Initially removes any existing elements from the DOM, then creates a new grid based on
 * the set sketch size variable.
 * divs are appropriately sized based on overall sketch width setting and css flexbox controls.
 */
function generatePixels() {
  // clear any existing layout/pixels
  let existingPixels = document.querySelectorAll(`.${PIXEL_CLASS}`)
  existingPixels.forEach((pixelElement) => {
    sysVars.sketchDOM.removeChild(pixelElement)
  })
  // generate a new grid of pixels
  let pixelFlexBasis = Math.floor(SKETCH_WIDTH / sysVars.sketchSize)
  for (let i = 0; i < Math.pow(sysVars.sketchSize, 2); i++) {
    let pixel = document.createElement('div')
    pixel.setAttribute('class', PIXEL_CLASS)
    pixel.style.flexBasis = `${pixelFlexBasis}px`
    pixel.style.minHeight = `${pixelFlexBasis}px`
    pixel.style.backgroundColor = '#FFFFFF' // sketch initial color = white
    pixel.addEventListener('mouseover', () => {
      const currentColor = pixel.style.backgroundColor
      pixel.style.backgroundColor = colorizer(currentColor)
    })
    sysVars.sketchDOM.appendChild(pixel)
  }
}

/**
 * Sets up the initial state of the sketch and attaches all the needed function handlers
 * to the page's DOM elements.
 */
function setupSketch() {
  sysVars.sketchDOM = document.getElementById('sketch-canvas')
  // setup colorizer choices and handlers
  let colorizer_menu = document.getElementById('colorizer-selector')
  Object.entries(COLORIZER_METHODS).forEach(
    ([key, value]) => {
      let menuItem = document.createElement('option')
      menuItem.setAttribute('value', `${value}`)
      menuItem.innerText = `${key}`
      colorizer_menu.appendChild(menuItem)
    }
  )
  // set up handlers to show/hide extra colorizer options depending on active colorizer
  colorizer_menu.addEventListener('change', () => {
    const value = Number(colorizer_menu.value)
    sysVars.colorizerMethod = value
    if (value === 1) {
      sysVars.hsvControlsDOM.removeAttribute('hidden')
    } else {
      sysVars.hsvControlsDOM.setAttribute('hidden', 'true')
    }
  })
  // hsv mode-specific control handlers
  sysVars.hsvControlsDOM = document.getElementById('hsv-controls')
  sysVars.hsvControlsDOM.setAttribute('hidden', 'true')
  let hsvSatCtrlElement = document.getElementById('hsv-saturation')
  hsvSatCtrlElement.addEventListener('change', () => {
    setHsvSaturation(Number(hsvSatCtrlElement.value))
    hsvSatCtrlElement.value = sysVars.hsv_s * 100 // pull back parsed value for UI feedback
  })
  let hsvValCtrlElement = document.getElementById('hsv-value')
  hsvValCtrlElement.addEventListener('change', () => {
    setHsvValue(Number(hsvValCtrlElement.value))
    hsvValCtrlElement.value = sysVars.hsv_v * 100 // pull back parsed value for UI feedback
  })
  // sketch side size control element handler
  let sketchSizeCtrlElement = document.getElementById('sketch-size')
  sketchSizeCtrlElement.addEventListener('change', () => {
    setSketchSize(Number(sketchSizeCtrlElement.value))
    sketchSizeCtrlElement.value = sysVars.sketchSize // return parsed value for UI feedback
  })
  // sketch reset button handler
  let resetButtonElement = document.getElementById('reset-button')
  resetButtonElement.addEventListener('click', () => {
    generatePixels() // re-generate the sketch elements
  })
  sketchSizeCtrlElement.value = sysVars.sketchSize
  // generate the initial sketch canvas
  generatePixels()
}

/**
 * Setter method for changing the stored sketch size value
 *
 * @param {number} size number of squares per side of the sketch. Positive integer.
 */
function setSketchSize(size) {
  let parsedSize = Math.min(size, MAX_SKETCH_SIZE)
  parsedSize = Math.max(0, parsedSize)
  sysVars.sketchSize = parsedSize
}

// COLORIZING METHODS:

/**
 * Handler function that is called when the mouse interacts with the sketch. Depending on the
 * setting of `sysVars.colorizerMethod` which is controlled by the user through the menu. 
 * Calls and returns the appropriate color based on the active colorizer method chosen.
 *
 * @param {string} currentColorStr Takes the current color of the square being called upon for the
 * darkening and lightening methods to appropriately darken or lighten the color.
 * @returns color string for html styling
 */
function colorizer(currentColorStr) {
  let color = '#000000'  // ensure we get something
  switch (sysVars.colorizerMethod) {
    case 0: // 'classic' mode
      color = rgbStr(randRGB())
      break
    case 1: // HSV mode
      color = rgbStr(randRGBfromHSV())
      break
    case 2: // darkener
      color = rgbStr(darken(10, currentColorStr))
      break
    case 3: // lightener
      color = rgbStr(lighten(10, currentColorStr))
      break
    default:
      break
  }
  return color
}

/**
 * Takes an rgb string retrieved from the current state in the browser and converts it to
 * and rgb object reperesenting the 3 r, g, and b color values as integers between 0 and 255.
 *
 * @param {string} rgbString string in the form of '#123456' or 'rgb(123, 255, 34)'
 * @returns {rgb} {r: [0-255], g: [0-255], b: [0-255]}
 */
function rgbStrToRgb(rgbString) {
  let rgb = {r: 0, g: 0, b: 0}
  // parse rgb string
  const hex_re = /#?[0-9a-f]{6}/i // matches "#1234ab"
  const rgb_re = /rgb\((\d{1,3}, ){2}\d{1,3}\)/i // matches "rgb(255, 255, 255)"
  if (hex_re.test(rgbString)) {
    rgb.r = Number.parseInt(rgbString.substr(1,3), 16)
    rgb.g = Number.parseInt(rgbString.substr(3,5), 16)
    rgb.b = Number.parseInt(rgbString.substr(5), 16)
  } else if (rgb_re.test(rgbString)) {
    const rgbPart_re = /\d{1,3}/g
    const colorPart = rgbString.split(', ')
    let regexResult = colorPart[0].match(rgbPart_re)
    rgb.r = Number.parseInt(regexResult[0])
    regexResult = colorPart[1].match(rgbPart_re)
    rgb.g = Number.parseInt(regexResult[0])
    regexResult = colorPart[2].match(rgbPart_re)
    rgb.b = Number.parseInt(regexResult[0])
  }
  return rgb
}

/**
 * Colorizer function that takes the color of the square it's called on and darkens it by
 * a percentage equal to the percentage parameter.
 *
 * @param {number} percentage integer representation of a percentage 0-100
 * @param {string} original color retrieved from the current square as displayed in the browser
 * @returns {rgb} Darkened color values in rgb object form
 */
function darken(percentage, original) {
  return shadeHelper(-1 * percentage, original)
}

/**
 * Colorizer function that takes the color of the square it's called on and lightens it by
 * a percentage equal to the percentage parameter.
 *
 * @param {number} percentage integer representation of a percentage 0-100
 * @param {string} original color retrieved from the current square as displayed in the browser
 * @returns {rgb} Loghtened color values in rgb object form
 */
function lighten(percentage, original) {
  return shadeHelper(percentage, original)
}

/**
 * Helper function for darken() / lighten(). Does the actual color changing work by calculating
 * shadingValue based on the percentage passed (positive or negative determines shading direction)
 *
 * @param {number} percentage darkening/lightening value in range [-100 to 100]
 * @param {string} original original color to modify
 * @returns {rgb} modified rgb color values
 */
function shadeHelper(percentage, original) {
  let currentRGB = rgbStrToRgb(original)
  const shadingValue = Math.round(255 * (percentage / 100))
  for (const color in currentRGB) {
    currentRGB[color] += shadingValue
    if (percentage < 0 && currentRGB[color] < 0) {
      currentRGB[color] = 0
    } else if (percentage > 0 && currentRGB[color] > 255) {
      currentRGB[color] = 255
    }
  }
  return currentRGB
}

/**
 * Takes an rgb object describing separate color integers between 0 and 255 and converts them to 
 * a 6-digit hex color string for use with html styles
 *
 * @param {object} rgb {r: {number}, g: {number}, b: {number}}
 * @returns string in the form of "#1234ab"
 */
function rgbStr(rgb) {
  let colorString = '#'
  if (rgb.r < 16) {
    colorString = colorString.concat('0')
  }
  colorString = colorString.concat(rgb.r.toString(16))
  if (rgb.g < 16) {
    colorString = colorString.concat('0')
  }
  colorString = colorString.concat(rgb.g.toString(16))
  if (rgb.b < 16) {
    colorString = colorString.concat('0')
  }
  colorString = colorString.concat(rgb.b.toString(16))
  return colorString
}

/**
 * Convenience function to create a random rgb color and return the string reprentation
 *
 * @param {rgb} [rgb=randRGB()]
 * @returns {string} rgb string in the form of '#123FED'
 */
function randRGBstr(rgb = randRGB()) {
  return rgbStr(rgb)
}

/**
 * Generates a random integer value for r, g, and b colors.
 *
 * @returns {rgb} {r: [0-255], g: [0-255], b: [0-255]}
 */
function randRGB() {
  return {r: randInt(), g: randInt(), b: randInt()}
}

/** Generates a random HSV color, with the Saturation and Value fixed, but controllable.
 * Uses parameter destructuring to simulate named parameters - Can be called with any 
 * number of parameters given or none.
 *
 * @param {object} [{
 *     h = hue, or random integer,
 *     s = saturation, decimal 0-1,
 *     v = value, decimal 0-1
 *   }={}]
 * @returns rgb object describing red, green blue integer values between 0 and 255
 */
function randRGBfromHSV({
    h = randInt(360),
    s = sysVars.hsv_s,
    v = sysVars.hsv_v
  }={}) {
  // console.log(`h:${h}, s:${s}, v:${v}`)
  // Parameter control
  if (h < 0) {
    h = 0
  } else if (h > 360) {
    h = 360
  }
  if (s < 0) {
    s = 0
  } else if (s > 1) {
    s = 1
  }
  if (v < 0) {
    v = 0
  } else if (v > 1) {
    v = 1
  }
  // Calculate RGB from HSV (see wikipedia page on conversion method)
  const c = v * s
  const Hp = h / 60
  const x = c * (1 - Math.abs(Hp % 2 - 1))
  let rgb = [0, 0, 0]
  // console.log(`c:${c}, Hp:${Hp}, x:${x}`)
  if (0 <= Hp && Hp <= 1) {
    rgb = [c, x, 0]
  } else if (1 < Hp && Hp <= 2) {
      rgb = [x, c, 0]
  } else if (2 < Hp && Hp <= 3) {
    rgb = [0, c, x]
  } else if (3 < Hp && Hp <= 4) {
    rgb = [0, x, c]
  } else if (4 < Hp && Hp <= 5) {
    rgb = [x, 0, c]
  } else if (5 < Hp && Hp <= 6) {
    rgb = [c, 0, x]
  }
  const m = v - c
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

/**
 * helper function that sets the stored saturation setting for random HSV color selection
 *
 * @param {number} value integer between 0 and 100 (inclusive)
 */
function setHsvSaturation(value) {
  sysVars.hsv_s = scaleValueSaturation(value)
}

/**
 * helper function that sets the stored value setting for random HSV color selection
 *
 * @param {number} value integer between 0 and 100 (inclusive)
 */
function setHsvValue(value) {
  sysVars.hsv_v = scaleValueSaturation(value)
}

/** Helper function that takes a 0-100 value and returns a 0-1 decimal value
 * Ensures that the given value falls between 0 and 100.
 *
 * @param {number} value value between 0 and 100
 * @returns value between 0 and 1 (decimal)
 */
function scaleValueSaturation(value) {
  let scaledValue = value
  if (scaledValue > 100) {
    scaledValue = 100
  } else if (scaledValue < 0) {
    scaledValue = 0
  }
  scaledValue = scaledValue / 100
  return scaledValue
}

/** Generates a random integer between 0 and range, with range being an optional parameter.
 *
 * Some inspiration for this taken from https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 * @param {number} [range=255]
 * @returns {number} Resulting random integer
 */
function randInt(range = 255) {
  // calculate the golden ratio conjugate to give more even spacing to random
  const INV_PHI = 1 / ((1 + Math.sqrt(5)) / 2)
  let rand = Math.random()
  rand += INV_PHI
  rand = rand % 1
  return Math.round(rand * range)
}

// once page is loaded, call the setup method to initialize sketch
window.onload = setupSketch