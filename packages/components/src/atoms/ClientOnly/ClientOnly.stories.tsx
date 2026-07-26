import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "../Skeleton";
import { Text } from "../Text";
import { ClientOnly } from "./ClientOnly";

const meta: Meta<typeof ClientOnly> = {
  title: "Atoms/Utility/ClientOnly",
  component: ClientOnly,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof ClientOnly>;

export const Default: Story = {
  render: () => (
    <ClientOnly>
      <Text>Rendered only after mounting on the client.</Text>
    </ClientOnly>
  ),
};

export const WithFallback: Story = {
  name: "With a loading fallback",
  render: () => (
    <ClientOnly fallback={<Skeleton variant="text" width="16rem" />}>
      <Text>Content that depends on a browser-only API.</Text>
    </ClientOnly>
  ),
};
