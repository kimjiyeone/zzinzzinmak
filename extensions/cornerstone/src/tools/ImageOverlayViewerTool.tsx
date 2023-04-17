import { metaData, StackViewport, Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/core';
import { BaseTool } from '@cornerstonejs/tools';
import { guid } from '@ohif/core/src/utils';

/**
 * Image Overlay Viewer tool is not a traditional tool that requires user interactin.
 * But it is used to display Pixel Overlays. And it will provide toggling capability.
 */
class ImageOverlayViewerTool extends BaseTool {
  static toolName = 'ImageOverlayViewer';

  _renderingViewport: any;
  _cachedStats = [];

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;
    this._renderingViewport = viewport;

    const imageId = this._getReferencedImageId(viewport);
    if (!imageId) return;

    const targetId = this.getTargetId(viewport);
    if (!this._cachedStats[targetId])
      this._cachedStats[targetId] = {
        showOverlays: true,
        overlays: [],
      };
    const cachedStat = this._cachedStats[targetId];

    // if the overlay is turned off
    if (!cachedStat.showOverlays) return false;

    let overlays;
    ({ overlays } = metaData.get('overlayPlaneModule', imageId));
    overlays = overlays.filter(overlay => overlay.type === 'G');

    // no overlays
    if (!overlays || overlays.length <= 0) return;

    overlays.forEach(async (overlay, idx) => {
      try {
        if (!cachedStat.overlays[idx]) {
          // first time load? let's load data
          if (overlay.pixelData) {
            let pixelData = null;
            if (overlay.pixelData.Value) {
              pixelData = overlay.pixelData.Value;
            } else if (overlay.pixelData.retrieveBulkData) {
              pixelData = await overlay.pixelData.retrieveBulkData();
            }

            if (pixelData) {
              cachedStat.overlays[idx] = {
                ...overlay,
                pixelDataRaw: pixelData, // this will be an ArrayBuffer object
                _id: guid(),
              };
            }
          }
        }

        if (cachedStat.overlays[idx]) {
          this._renderOverlay(
            enabledElement,
            svgDrawingHelper,
            cachedStat.overlays[idx]
          );
        }
      } catch (e) {
        console.error('Failed to render overlay', e);
      }
    });

    return true;
  };

  _renderOverlay(enabledElement, svgDrawingHelper, overlayData) {
    if (!overlayData.color) {
      // TODO: check against the configured color as well
      // create pixel data from bit array of overlay data
      const { pixelDataRaw, rows: height, columns: width } = overlayData;
      const pixelDataView = new DataView(pixelDataRaw);
      const totalBits = width * height;
      // TODO: have this color from configuration or user settings
      const color = {
        r: 127,
        g: 127,
        b: 127,
        a: 255,
      };

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height); // make it transparent
      ctx.globalCompositeOperation = 'copy';
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0, bitIdx = 0, byteIdx = 0; i < totalBits; i++) {
        if (pixelDataView.getUint8(Math.floor(byteIdx)) & (1 << bitIdx)) {
          data[i * 4] = color.r;
          data[i * 4 + 1] = color.g;
          data[i * 4 + 2] = color.b;
          data[i * 4 + 3] = color.a;
        }

        // next bit, byte
        if (bitIdx >= 7) {
          bitIdx = 0;
          byteIdx++;
        } else {
          bitIdx++;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      overlayData.color = color;
      overlayData.dataUrl = canvas.toDataURL();
    }

    // get original image's size
    const { viewport } = enabledElement;
    const imageId = this._getReferencedImageId(viewport);
    if (!imageId) return;

    const { _id, columns: width, rows: height, x, y } = overlayData;

    const overlayTopLeftWorldPos = utilities.imageToWorldCoords(imageId, [
      x - 1,
      y - 1,
    ]);
    const overlayTopLeftOnCanvas = viewport.worldToCanvas(
      overlayTopLeftWorldPos
    );
    const overlayBottomRightWorldPos = utilities.imageToWorldCoords(imageId, [
      width,
      height,
    ]);
    const overlayBottomRightOnCanvas = viewport.worldToCanvas(
      overlayBottomRightWorldPos
    );

    // add image to the svg layer
    const svgns = 'http://www.w3.org/2000/svg';
    const svgNodeHash = `image-overlay-${_id}`;
    const existingImageElement = svgDrawingHelper.getSvgNode(svgNodeHash);

    const attributes = {
      'data-id': svgNodeHash,
      width: overlayBottomRightOnCanvas[0] - overlayTopLeftOnCanvas[0],
      height: overlayBottomRightOnCanvas[1] - overlayTopLeftOnCanvas[1],
      x: overlayTopLeftOnCanvas[0],
      y: overlayTopLeftOnCanvas[1],
      href: overlayData.dataUrl,
    };

    if (
      isNaN(attributes.x) ||
      isNaN(attributes.y) ||
      isNaN(attributes.width) ||
      isNaN(attributes.height)
    ) {
      console.warn(
        'Invalid rendering attribute for image overlay',
        attributes['data-id']
      );
      return false;
    }
    console.log(
      'rendering overlay image with attributes',
      attributes['data-id']
    );

    if (existingImageElement) {
      _setAttributesIfNecessary(attributes, existingImageElement);
      svgDrawingHelper.setNodeTouched(svgNodeHash);
    } else {
      const newImageElement = document.createElementNS(svgns, 'image');
      _setNewAttributesIfValid(attributes, newImageElement);
      svgDrawingHelper.appendNode(newImageElement, svgNodeHash);
    }
    return true;
  }

  /**
   * Get viewport's referene image id,
   * TODO: maybe we should add this to the BaseTool or AnnotationTool class
   * as it is often used by tools.
   *
   * @param viewport
   * @returns
   */
  _getReferencedImageId(
    viewport: Types.IStackViewport | Types.IVolumeViewport
  ): string {
    const targetId = this.getTargetId(viewport);

    let referencedImageId;

    if (viewport instanceof StackViewport) {
      referencedImageId = targetId.split('imageId:')[1];
    }

    return referencedImageId;
  }
}

function _setAttributesIfNecessary(attributes, svgNode: SVGElement) {
  Object.keys(attributes).forEach(key => {
    const currentValue = svgNode.getAttribute(key);
    const newValue = attributes[key];
    if (newValue === undefined || newValue === '') {
      svgNode.removeAttribute(key);
    } else if (currentValue !== newValue) {
      svgNode.setAttribute(key, newValue);
    }
  });
}

function _setNewAttributesIfValid(attributes, svgNode: SVGElement) {
  Object.keys(attributes).forEach(key => {
    const newValue = attributes[key];
    if (newValue !== undefined && newValue !== '') {
      svgNode.setAttribute(key, newValue);
    }
  });
}

export default ImageOverlayViewerTool;
