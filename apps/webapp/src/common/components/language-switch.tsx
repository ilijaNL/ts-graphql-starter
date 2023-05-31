import { useState } from 'react';
import { createStyles, UnstyledButton, Menu, Image, Group } from '@mantine/core';
import { IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from '../translations/use-translation';

const data = [
  { label: 'English', locale: 'en', image: '/icons/en_flag.svg' },
  // { label: 'Nederlands', locale: 'nl', image: '/icons/nl_flag.svg' },
];

const useStyles = createStyles((theme, { opened }: { opened: boolean }) => ({
  control: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]}`,
    transition: 'background-color 150ms ease',
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[opened ? 5 : 6] : opened ? theme.colors.gray[0] : theme.white,
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
    },
  },

  label: {
    fontWeight: 500,
    fontSize: theme.fontSizes.sm,
  },

  icon: {
    transition: 'transform 150ms ease',
    transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
  },
}));

export function LanguageSwitch() {
  const [opened, setOpened] = useState(false);
  const { classes } = useStyles({ opened });
  const { setLng, locale } = useTranslation();
  const [selected, setSelected] = useState(data.find((i) => i.locale === locale)!);
  const items = data.map((item) => (
    <Menu.Item
      icon={<Image alt={item.label} src={item.image} width={18} height={18} radius={120} />}
      onClick={() => {
        setSelected(item);
        setLng(item.locale);
      }}
      key={item.label}
    >
      {item.label}
    </Menu.Item>
  ));

  return (
    <Menu onOpen={() => setOpened(true)} onClose={() => setOpened(false)}>
      <Menu.Target>
        <UnstyledButton component="button" className={classes.control}>
          <Group spacing="xs">
            <Image alt={selected.label} src={selected.image} width={22} height={22} radius={120} />
            {/* <span className={classes.label}>{selected.label}</span> */}
          </Group>
          <IconChevronUp size={16} className={classes.icon} stroke={1.5} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>{items}</Menu.Dropdown>
    </Menu>
  );
}
