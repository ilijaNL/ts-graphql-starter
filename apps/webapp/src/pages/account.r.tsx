import { useUser } from '@/common/session';
import { useTranslation } from '@/common/translations/use-translation';
import { createFormResolver } from '@/common/typebox-resolver';
import { createAuthPage } from '@/common/wrapper';
import {
  Box,
  Button,
  Container,
  createStyles,
  Paper,
  Stack,
  TextInput,
  Title,
  Select,
  Grid,
  Image as MImage,
  useMantineTheme,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Text } from '@mantine/core';
import { Static, account } from '@ts-hasura-starter/api';
import { Controller, useForm } from 'react-hook-form';
import If from '@/common/components/if';
import ImageUpload from '@/common/components/image-upload';
import { P, match } from 'ts-pattern';
import { Dropzone } from '@mantine/dropzone';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { useLocalImage } from '@/common/hooks';
import { useMutation } from '@tanstack/react-query';
import { signOut } from '@/common/auth';
import { getImagePath, isNextJSImage } from '@/config';
import Image from 'next/image';
import { modals } from '@mantine/modals';
import { useClientMutation } from '@/common/builder-hooks';
import { apiClient } from '@/api-client';

type ChangeProfileInfoForm = Static<typeof account.contract.update_account_info.body>;

const UserSettings = () => {
  const { t } = useTranslation();
  const { user, refresh } = useUser();

  const {
    formState: { isDirty, errors },
    control,
    setValue,
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: createFormResolver(account.contract.update_account_info.body),
    defaultValues: {
      displayName: user.info?.display_name,
      locale: (user.info?.locale as account.Locale) ?? 'en',
    },
  });

  const theme = useMantineTheme();
  const localImageInput = useLocalImage();

  const { mutate: deleteAccount, isLoading: isDeleting } = useClientMutation(apiClient.me.delete, {
    onSuccess: () => {
      signOut();
    },
  });

  const {
    mutate,
    error,
    isLoading: isChanging,
  } = useMutation(
    async (value: ChangeProfileInfoForm) => {
      let image: { sig: string; path: string } | undefined = undefined;
      if (localImageInput.image) {
        const img = localImageInput.image;

        const getSignedDataRes = await apiClient.me
          .get_avatar_upload_link({
            body: {
              contentType: img.type as any,
              extension: img.name.split('.').pop()! as any,
            },
          })
          .then((d) => {
            if (d.ok) {
              return d.data;
            }
            throw d.error;
          });

        const data: Record<string, any> = {
          ...getSignedDataRes.signed_data.fields,
          'Content-Type': img.type,
          file: img,
        };

        const formData = new FormData();

        for (const name in data) {
          formData.append(name, data[name]);
        }

        const upload = await fetch(getSignedDataRes.signed_data.url, {
          method: 'POST',
          body: formData,
        });

        if (!upload.ok) {
          throw new Error('Upload failed.');
        }

        image = {
          path: getSignedDataRes.relative_path,
          sig: getSignedDataRes.path_sig,
        };
      }

      return apiClient.me
        .update_account_info({
          body: {
            ...value,
            image: image,
          },
        })
        .then((d) => {
          if (d.ok) {
            return d.data;
          }
          throw d.error;
        });
    },
    {
      onSuccess() {
        localImageInput.setImage(undefined);
        refresh();
        reset({}, { keepValues: true });
        showNotification({
          title: t(`Saved`),
          message: '',
          color: 'green',
        });
      },
    }
  );

  const isSubmitting = isChanging || isDeleting;

  return (
    <form autoComplete="off" noValidate onSubmit={handleSubmit((d) => mutate(d))}>
      <Grid align="center">
        <Grid.Col md={4} sm={12}>
          <Box sx={{ maxWidth: 250, margin: '0 auto' }}>
            <ImageUpload
              dropzoneProps={{
                loading: isSubmitting,
                padding: 10,
              }}
              onChange={(img) => {
                localImageInput.setImage(img);
                setValue('image', undefined, { shouldDirty: true });
              }}
              remoteImageURL={user.info?.avatar_url ?? undefined}
              onBlur={() => {
                //
              }}
              value={localImageInput.image}
              render={(props) =>
                match(props)
                  .with({ localImage: P.not(P.nullish) }, (d) => (
                    <MImage src={d.localImage} fit="cover" width={220} height={220} mx="auto" radius="md" />
                  ))
                  .with({ remoteImage: P.not(P.nullish) }, (d) => {
                    const imagePath = getImagePath(d.remoteImage);

                    if (isNextJSImage(imagePath)) {
                      return (
                        <Image
                          src={imagePath}
                          alt="avatar"
                          width={226}
                          height={226}
                          style={{ margin: '0 auto', objectFit: 'cover' }}
                        />
                      );
                    }

                    return <MImage src={imagePath} fit="cover" width={220} height={220} mx="auto" radius="md" />;
                  })
                  .otherwise(() => (
                    <Stack h={220} justify="center" align="center">
                      <Dropzone.Accept>
                        <IconUpload
                          size={50}
                          stroke={1.5}
                          color={theme.colors[theme.primaryColor]![theme.colorScheme === 'dark' ? 4 : 6]}
                        />
                      </Dropzone.Accept>
                      <Dropzone.Reject>
                        <IconX size={50} stroke={1.5} color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]} />
                      </Dropzone.Reject>
                      <Dropzone.Idle>
                        <IconPhoto size={50} stroke={1.5} />
                      </Dropzone.Idle>

                      <div>
                        <Text size="sm" color="dimmed" align="center" inline mt={7}>
                          Image size should not exceed 3mb
                        </Text>
                      </div>
                    </Stack>
                  ))
              }
            />
          </Box>
        </Grid.Col>
        <Grid.Col md={8} sm={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Stack spacing="md">
            <Title order={2}>My account settings</Title>
            <TextInput label={'Account id'} disabled value={user.id} />
            <TextInput {...register('displayName')} error={errors.displayName?.message} label={t('profile_name')} />
            <Controller
              control={control}
              name="locale"
              render={({ field }) => (
                <Select label={t('Language')} {...field} data={[{ value: 'en', label: 'English' }]} />
              )}
            />
          </Stack>
          <If
            value={error as any}
            render={(error) => (
              <Text c="dimmed" color="red">
                {error.message}
              </Text>
            )}
          />
          <Box style={{ flexGrow: 1 }} />
          <Button loading={isSubmitting} mt="sm" fullWidth variant="gradient" type="submit" disabled={!isDirty}>
            {t('Save')}
          </Button>
          <Button
            loading={isSubmitting}
            mt="sm"
            color="red"
            onClick={() => {
              modals.openConfirmModal({
                title: 'Please confirm your action',
                centered: true,
                confirmProps: { color: 'red' },
                children: (
                  <Text size="sm">Are you sure you want to delete this account? This is an irreversible action!</Text>
                ),
                labels: { confirm: t('Continue'), cancel: t('Cancel') },
                onConfirm: () => deleteAccount({}),
              });
            }}
          >
            {t('Delete')} Account
          </Button>
        </Grid.Col>
      </Grid>
    </form>
  );
};

const usePageStyles = createStyles((theme) => ({
  item: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
  },
}));

const page = createAuthPage({
  pageComponent: function AccountSettingsPage() {
    const { classes } = usePageStyles();
    return (
      <Container size="md" mt="lg">
        <Paper className={classes.item}>
          <UserSettings />
        </Paper>
      </Container>
    );
  },
});

export default page;
