import React from 'react';
import PropTypes from 'prop-types';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import useServer from '../customHooks/useServer';
import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

/**
 * Get array of seriesUIDs from param or from queryString
 * @param {*} seriesInstanceUIDs
 * @param {*} location
 */
const getSeriesInstanceUIDs = (seriesInstanceUIDs, routeLocation) => {
  const queryFilters = UrlUtil.queryString.getQueryFilters(routeLocation);
  const querySeriesUIDs = queryFilters && queryFilters['seriesInstanceUID'];
  const _seriesInstanceUIDs = seriesInstanceUIDs || querySeriesUIDs;

  return UrlUtil.paramString.parseParam(_seriesInstanceUIDs);
};

function ViewerRouting({
  match: routeMatch,
  location: routeLocation,
  options: routeOptions,
}) {
  const {
    project,
    location,
    dataset,
    dicomStore,
    studyInstanceUIDs,
    seriesInstanceUIDs,
  } = routeMatch.params;
  const server = useServer({ project, location, dataset, dicomStore });

  const studyUIDs = UrlUtil.paramString.parseParam(studyInstanceUIDs);
  const seriesUIDs = getSeriesInstanceUIDs(seriesInstanceUIDs, routeLocation);

  if (server && studyUIDs) {
    return (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUIDs={studyUIDs}
        seriesInstanceUIDs={seriesUIDs}
        options={routeOptions}
      />
    );
  }

  return null;
}

ViewerRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      studyInstanceUIDs: PropTypes.string.isRequired,
      seriesInstanceUIDs: PropTypes.string,
      dataset: PropTypes.string,
      dicomStore: PropTypes.string,
      location: PropTypes.string,
      project: PropTypes.string,
    }),
  }),
  location: PropTypes.object,
  options: PropTypes.object,
};

export default ViewerRouting;
