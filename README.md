# FreshTrack Application

This project is a React application for managing food inventory and reducing waste. It includes tools to convert React JSX code to plain JavaScript using `React.createElement()` calls.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode with JSX support.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder with JSX support.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## JSX to JavaScript Conversion

This project includes tools to convert React JSX code to plain JavaScript.

### Understanding JSX to JavaScript Conversion

JSX is a syntax extension for JavaScript that looks similar to HTML but gets transformed into `React.createElement()` calls before being executed in the browser. For example:

```jsx
// JSX
<div className="container">
  <h1>Hello World</h1>
</div>
```

Gets converted to:

```javascript
// Plain JavaScript
React.createElement(
  "div", 
  { className: "container" },
  React.createElement("h1", null, "Hello World")
);
```

### Converting JSX to JavaScript

#### Simplified Scripts

We've added convenience scripts to make the conversion process easier:

```bash
# Clean previous builds and convert JSX to JS
npm run clean-convert

# Clean, convert, and build with webpack
npm run clean-convert-build
```

#### Individual Steps

If you prefer to run the steps individually:

1. Clean previous builds:
```bash
npm run clean
```

2. Convert JSX to JS:
```bash
npm run convert-jsx
```

3. Build with webpack:
```bash
npm run webpack
```

4. Or combine the conversion and webpack build:
```bash
npm run build-no-jsx
```

### Serving the JavaScript Version

To serve the JavaScript version:

```bash
npm run webpack-dev
```

This will start a development server on http://localhost:3000 with your JSX-free application.

## Project Structure

- `babel.config.json`: Configuration for Babel to properly transform JSX to React.createElement calls
- `webpack.config.js`: Configuration for bundling the converted JavaScript files
- `scripts/convertJsxToJs.js`: Main script that processes all React files and converts JSX to JS
- `scripts/clean-and-convert.js`: Helper script for cleaning and running the conversion process
- `src/`: Source code with JSX
- `build-js/`: Generated JavaScript code without JSX (created by the conversion script)
- `dist/`: Bundled application (created by webpack)

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
