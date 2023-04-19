import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DicomFileUploader, {
  DicomFileUploaderProgressEvent,
  EVENTS,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { Icon } from '@ohif/ui';

type DicomUploadProgressItemProps = {
  dicomFileUploader: DicomFileUploader;
};

function DicomUploadProgressItem({
  dicomFileUploader,
}: DicomUploadProgressItemProps): ReactElement {
  const [percentComplete, setPercentComplete] = useState(
    dicomFileUploader.getPercentComplete()
  );
  const [failedReason, setFailedReason] = useState('');

  const isComplete = () =>
    dicomFileUploader.getStatus() === UploadStatus.Failed ||
    dicomFileUploader.getStatus() === UploadStatus.Success;

  useEffect(() => {
    const progressSubscription = dicomFileUploader.subscribe(
      EVENTS.PROGRESS,
      (dicomFileUploaderProgressEvent: DicomFileUploaderProgressEvent) => {
        setPercentComplete(dicomFileUploaderProgressEvent.percentComplete);
      }
    );

    dicomFileUploader.load().catch(reason => {
      setFailedReason(reason?.toString() ?? '');
    });

    return () => progressSubscription.unsubscribe();
  }, []);

  const cancelUpload = useCallback(() => {
    dicomFileUploader.cancel();
  }, []);

  const getStatusIcon = (): ReactElement => {
    switch (dicomFileUploader.getStatus()) {
      case UploadStatus.Success:
        return (
          <Icon name="status-tracked" className="text-primary-light"></Icon>
        );
      case UploadStatus.InProgress:
        return <Icon name="icon-transferring"></Icon>;
      case UploadStatus.Failed:
        return <Icon name="icon-alert-small"></Icon>;
      default:
        return <></>;
    }
  };

  return (
    <div className="flex w-full p-2.5 text-lg min-h-14 items-center border-b border-secondary-light overflow-hidden">
      <div className="flex flex-col gap-1 self-top w-0 grow shrink">
        <div className="flex gap-4">
          <div className="flex w-6 justify-center items-center">
            {getStatusIcon()}
          </div>
          <div className="text-ellipsis whitespace-nowrap overflow-hidden">
            {dicomFileUploader.getFileName()}
          </div>
        </div>
        {failedReason && <div className="pl-10">{failedReason}</div>}
      </div>
      {!isComplete() && (
        <div className="ml-auto flex gap-6 grow shrink w-1 justify-end items-center">
          {dicomFileUploader.getStatus() === UploadStatus.InProgress && (
            <div className="w-10 text-right">{percentComplete}%</div>
          )}
          <div className="flex cursor-pointer">
            <Icon
              className="w-6 h-6 self-center text-primary-active"
              name="close"
              onClick={cancelUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}

DicomUploadProgressItem.propTypes = {
  dicomFileUploader: PropTypes.instanceOf(DicomFileUploader).isRequired,
};

export default DicomUploadProgressItem;
