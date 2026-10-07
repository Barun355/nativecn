import { Stack } from "expo-router";
import { Linking } from "react-native";

import { FONT_LICENCES, PACKAGE_LICENCES, type Licence } from "@/licenses";
import { Container } from "@/registry/components/container";
import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
} from "@/registry/components/list";
import { createStyles } from "@/registry/theme";

// The open-source licences of everything the app ships: its packages and the 8 bundled fonts.
export default function LicensesScreen() {
  const styles = useStyles();
  return (
    <Container edges={["bottom"]} padded={false} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Open-source licences" }} />
      <Section title="Fonts" licences={FONT_LICENCES} footer="SIL Open Font License 1.1." />
      <Section title="Packages" licences={PACKAGE_LICENCES} />
    </Container>
  );
}

function Section({
  title,
  licences,
  footer,
}: {
  title: string;
  licences: Licence[];
  footer?: string;
}) {
  return (
    <ListSection>
      <ListSectionHeader>{title}</ListSectionHeader>
      {licences.map(({ name, licence, url }) => (
        <ListItem
          key={name}
          title={name}
          trailing={licence}
          onPress={() => {
            Linking.openURL(url).catch(() => {});
          }}
        />
      ))}
      {footer ? <ListSectionFooter>{footer}</ListSectionFooter> : null}
    </ListSection>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6], paddingVertical: t.spacing[4] },
}));
