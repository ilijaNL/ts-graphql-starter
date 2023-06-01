import { useEffect, useState } from 'react';

/**
 * Hook tthat can be used to show local image
 * @param init
 * @returns
 */
export const useLocalImage = (init?: File) => {
  const [previewImage, setPreview] = useState<string>();
  const [image, setImage] = useState(init);

  useEffect(() => {
    if (!image) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  return {
    previewImage,
    setImage,
    image,
  };
};
