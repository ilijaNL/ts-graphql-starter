import dynamic from 'next/dynamic';
import { openModal } from '@mantine/modals';
import { ModalSettings } from '@mantine/modals/lib/context';

const LazyLoginForm = dynamic(() => import('@/common/components/login/login-form'), { ssr: false });

export function openLoginModal(title: string, modalSettings?: ModalSettings) {
  openModal({
    title: title,
    centered: true,
    size: 'lg',
    ...modalSettings,
    children: <LazyLoginForm />,
  });
}

export default LazyLoginForm;
