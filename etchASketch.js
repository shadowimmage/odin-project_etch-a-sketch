
const SKETCH_WIDTH = 900
const PIXEL_CLASS = 'sketch-pixel'

let sysVars = {
  sketchSize: 40,   // default 40x40 grid
  sketchDOM: null,  // initialized in setup
  colorizerMethod: 2,
  hsvControlsDOM: null,
  hsv_s: 1,
  hsv_v: 1,
}

const COLORIZER_METHODS = {
  "Darken": 2,
  "Lighten": 3,
  "Classic Random": 0,
  "HSV Random": 1,
}

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
    pixel.style.backgroundColor = '#FFFFFF'
    pixel.addEventListener('mouseover', () => {
      const currentColor = pixel.style.backgroundColor
      pixel.style.backgroundColor = colorizer(currentColor)
    })
    sysVars.sketchDOM.appendChild(pixel)
  }
}

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
  colorizer_menu.addEventListener('change', () => {
    const value = Number(colorizer_menu.value)
    sysVars.colorizerMethod = value
    if (value === 1) {
      sysVars.hsvControlsDOM.removeAttribute('hidden')
    } else {
      sysVars.hsvControlsDOM.setAttribute('hidden', 'true')
    }
  })
  sysVars.hsvControlsDOM = document.getElementById('hsv-controls')
  sysVars.hsvControlsDOM.setAttribute('hidden', 'true')
  let hsvSatCtrlElement = document.getElementById('hsv-saturation')
  hsvSatCtrlElement.addEventListener('change', () => {
    setHsvSaturation(Number(hsvSatCtrlElement.value))
    hsvSatCtrlElement.value = sysVars.hsv_s * 100
  })
  let hsvValCtrlElement = document.getElementById('hsv-value')
  hsvValCtrlElement.addEventListener('change', () => {
    setHsvValue(Number(hsvValCtrlElement.value))
    hsvValCtrlElement.value = sysVars.hsv_v * 100
  })
  let sketchSizeCtrlElement = document.getElementById('sketch-size')
  sketchSizeCtrlElement.addEventListener('change', () => {
    setSketchSize(Number(sketchSizeCtrlElement.value))
    sketchSizeCtrlElement.value = sysVars.sketchSize
  })
  let resetButtonElement = document.getElementById('reset-button')
  resetButtonElement.addEventListener('click', () => {
    generatePixels()
  })
  sketchSizeCtrlElement.value = sysVars.sketchSize
  generatePixels()
}

function setSketchSize(size) {
  let parsedSize = Math.min(size, 200)
  parsedSize = Math.max(0, parsedSize)
  sysVars.sketchSize = parsedSize
}

// COLORIZING METHODS:

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

function rgbStrToRgb(rgbString) {
  let rgb = {r: 0, g: 0, b: 0}
  // parse rgb string
  const hex_re = /#?[da-f]{6}/i
  const rgb_re = /rgb\((\d{1,3}, ){2}\d{1,3}\)/i
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

function darken(percentage, original) {
  return shadeHelper(-1 * percentage, original)
}

function lighten(percentage, original) {
  return shadeHelper(percentage, original)
}

function shadeHelper(percentage, original) {
  let currentRGB = rgbStrToRgb(original)
  const darkeningValue = Math.round(255 * (percentage / 100))
  for (const color in currentRGB) {
    currentRGB[color] += darkeningValue
    if (percentage < 0 && currentRGB[color] < 0) {
      currentRGB[color] = 0
    } else if (percentage > 0 && currentRGB[color] > 255) {
      currentRGB[color] = 255
    }
  }
  return currentRGB
}

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

function randRGBstr(rgb = randRGB()) {
  return rgbStr(rgb)
}

function randRGB() {
  return {r: randInt(), g: randInt(), b: randInt()}
}

/**
 * Uses parameter destructuring to simulate named parameters
 *
 * @param {*} [{
 *     h = randInt(360),
 *     s = 1,
 *     v = 1
 *   }={}]
 * @returns
 */
function randRGBfromHSV({
    h = randInt(360),
    s = sysVars.hsv_s,
    v = sysVars.hsv_v
  }={}) {
  // console.log(`h:${h}, s:${s}, v:${v}`)
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

function setHsvSaturation(value) {
  sysVars.hsv_s = setHsvSaturationOrValue(value)
}

function setHsvValue(value) {
  sysVars.hsv_v = setHsvSaturationOrValue(value)
}

function setHsvSaturationOrValue(value) {
  let scaledValue = value
  if (scaledValue > 100) {
    scaledValue = 100
  } else if (scaledValue < 0) {
    scaledValue = 0
  }
  scaledValue = scaledValue / 100
  return scaledValue
}

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