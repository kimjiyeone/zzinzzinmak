import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../LungModuleSimilarityPanel.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';
import { servicesManager } from '../../../App';
import { JobsContext } from '../../../context/JobsContext';

const SearchDetails = props => {
  const { user } = props;
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();
  const [element, setElement] = React.useState();

  const { UINotificationService } = servicesManager.services;

  const access_token = user.access_token;

  const client = axios.create({
    baseURL: 'https://radcadapi.thetatech.ai',
    timeout: 90000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${access_token}`;
    return config;
  });

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    setElement(element);

    // retrieving rectangle tool roi data from element
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');

    if (tool_data && tool_data.data.length > 0) {
      setToolData(tool_data.data[0]);

      let startX = parseInt(tool_data.data[0].handles.start.x.toFixed(2));
      let startY = parseInt(tool_data.data[0].handles.start.y.toFixed(2));
      let endX = parseInt(tool_data.data[0].handles.end.x.toFixed(2));
      let endY = parseInt(tool_data.data[0].handles.end.y.toFixed(2));

      const x_min = Math.min(startX, endX);
      const x_max = Math.max(startX, endX);
      const y_min = Math.min(startY, endY);
      const y_max = Math.max(startY, endY);
      const width = x_max - x_min;
      const height = y_max - y_min;
      setX(x_min);
      setY(y_min);
      setHeight(height);
      setWidth(width);
      setIsDisabled(false);
    }

    // Pull event from cornerstone-tools
    const { EVENTS } = cornerstoneTools;
    element.addEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);

    return () =>
      element.removeEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);
  }, []);

  const eventhandler = event => {
    setIsDisabled(true);
    setToolData(event.detail.measurementData);
    let startX = parseInt(
      event.detail.measurementData.handles.start.x.toFixed(2)
    );
    let startY = parseInt(
      event.detail.measurementData.handles.start.y.toFixed(2)
    );
    let endX = parseInt(event.detail.measurementData.handles.end.x.toFixed(2));
    let endY = parseInt(event.detail.measurementData.handles.end.y.toFixed(2));

    const x_min = Math.min(startX, endX);
    const x_max = Math.max(startX, endX);
    const y_min = Math.min(startY, endY);
    const y_max = Math.max(startY, endY);
    const width = x_max - x_min;
    const height = y_max - y_min;
    setX(x_min);
    setY(y_min);
    setHeight(height);
    setWidth(width);
    setIsDisabled(false);
  };

  const triggerJob = () => {
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    const data = tool_data.data[0];

    sendParams(data);
  };

  const clearParams = () => {
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.get(
      element,
      'RectangleRoi'
    );

    if (!toolState) {
      setToolData({});
      setX();
      setY();
      setHeight();
      setWidth();
      setIsDisabled(true);
    }
  };

  const sendParams = async data => {
    const series_uid = data.SeriesInstanceUID;
    const study_uid = data.StudyInstanceUID;
    const email = user.profile.email;

    const body = {
      study_uid: study_uid,
      series_uid: series_uid,
      email: email,
      parameters: {
        rectangle: {
          x: x,
          y: y,
          w: width,
          h: height,
        },
      },
    };

    console.log({ searchData: body });

    return;

    await client
      .post(`/texture`, body)
      .then(response => {
        cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
          {}
        );
        cornerstone.updateImage(element);

        if (response.status === 202) {
          UINotificationService.show({
            message:
              'Job triggered successfully. Please wait for it to be completed',
            duration: 5000,
          });
        }

        // clearing all params
        clearParams();

        // set stackscroll as active tool
        cornerstoneTools.setToolActive('StackScroll', { mouseButtonMask: 1 });
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <div className="component">
      {Object.keys(toolData).length > 0 && (
        <div>
          <div className="title-header">Parameters</div>
          <h4>Dimensions </h4>
          <p>
            <b>Width:</b> {width}
          </p>
          <p>
            <b>Height:</b> {height}
          </p>
          <h4>Coordinates</h4>
          <p>
            <b>x:</b> {x}
          </p>
          <p>
            <b>y:</b> {y}
          </p>
          <br />

          <label>
            <div className="triggerButton">
              <button
                onClick={triggerJob}
                disabled={isDisabled}
                className="syncButton"
              >
                Search For Similarity
              </button>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedSearchDetails = connect(
  mapStateToProps,
  null
)(SearchDetails);

export default ConnectedSearchDetails;
