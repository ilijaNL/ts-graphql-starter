import { ThemeIcon, ThemeIconProps } from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';

export const LogoIcon: React.FC<Omit<ThemeIconProps, 'children'>> = (props) => (
  <ThemeIcon size={45} radius="md" color="blue" {...props}>
    <IconBolt size={38} strokeWidth={1.2} />
  </ThemeIcon>
);
