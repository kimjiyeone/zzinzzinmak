/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index-umd.js`
 */

import 'regenerator-runtime/runtime';

import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';
// test

/**
 * EXTENSIONS
 * =================
 *
 * Importing and modifying the extensions our app uses HERE allows us to leverage
 * tree shaking and a few other niceties. However, by including them here they become
 * "baked in" to the published application.
 *
 * Depending on your use case/needs, you may want to consider not adding any extensions
 * by default HERE, and instead provide them via the extensions configuration key or
 * by using the exported `App` component, and passing in your extensions as props using
 * the defaultExtensions property.
 */
import OHIFVTKExtension from '@ohif/extension-vtk';
import OHIFDicomHtmlExtension from '@ohif/extension-dicom-html';
import OHIFDicomSegmentationExtension from '@ohif/extension-dicom-segmentation';
import OHIFDicomRtExtension from '@ohif/extension-dicom-rt';
import OHIFDicomMicroscopyExtension from '@ohif/extension-dicom-microscopy';
import OHIFDicomPDFExtension from '@ohif/extension-dicom-pdf';
import OHIFDicomTagBrowserExtension from '@ohif/extension-dicom-tag-browser';
import OHIFDebuggingExtension from '@ohif/extension-debugging';
// Add this for Debugging purposes:
import OHIFDicomModelPredictionExtension from '../../../extensions/dicom-model-prediction';
import { version } from '../package.json';

/*
 * Default Settings
 */
let config = {};

if (window) {
  config = window.config || {};

  window.version = version;
}

const appProps = {
  config,
  defaultExtensions: [
    OHIFVTKExtension,
    OHIFDicomHtmlExtension,
    OHIFDicomMicroscopyExtension,
    OHIFDicomPDFExtension,
    OHIFDicomSegmentationExtension,
    OHIFDicomRtExtension,
    OHIFDicomTagBrowserExtension,
    [
      OHIFDicomModelPredictionExtension,
      {
        modelsDetails: [
          {
            id: '1',
            name: 'First Model',
            predictionApi: 'http://127.0.0.1:5000/prediction',
            infoApi: 'https://testapi.io/api/segseg/model_info',
          },
          {
            id: '2',
            name: 'Second Model',
            predictionApi: 'http://127.0.0.1:5000/prediction',
            infoApi: 'https://testapi.io/api/segseg/model_info',
          },
          {
            id: '3',
            name: 'Third Model',
            predictionApi: 'http://127.0.0.1:5000/prediction',
            infoApi: 'https://testapi.io/api/segseg/model_info',
          },
        ],
      },
    ],
  ],
};

/** Create App */
const app = React.createElement(App, appProps, null);

/** Render */
ReactDOM.render(app, document.getElementById('root'));
