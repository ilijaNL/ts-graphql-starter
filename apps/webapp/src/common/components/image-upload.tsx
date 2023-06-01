import { Dropzone, DropzoneProps, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useLocalImage } from '../hooks';

type ImageUploadProps = {
  onBlur: () => void;
  remoteImageURL?: string | undefined;
  value: File | undefined;
  onChange: (file: FileWithPath) => void;
  render: (props: { localImage: string | undefined; remoteImage: string | undefined }) => React.ReactNode;
  dropzoneProps?: Omit<DropzoneProps, 'onDrop' | 'children'>;
};

const ImageUpload: React.FC<ImageUploadProps> = (props) => {
  const { previewImage, setImage } = useLocalImage(props.value);

  return (
    <Dropzone
      {...props.dropzoneProps}
      multiple={false}
      onBlur={props.onBlur}
      onDrop={(files) => {
        if (files[0]) {
          props.onChange(files[0]);
          setImage(files[0]);
        }
      }}
      maxSize={3 * 1024 ** 2}
      accept={IMAGE_MIME_TYPE}
    >
      {props.render({ localImage: previewImage, remoteImage: props.remoteImageURL })}
    </Dropzone>
  );
};

export default ImageUpload;
