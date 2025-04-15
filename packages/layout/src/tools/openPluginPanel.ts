import { z } from 'zod'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the plugin')
});

export const openPluginPanel = {
  name: 'open_plugin_panel',
  order: 6,
  description:
    "Open a plugin panel to the current TinyEngine low-code application. Use this when you need to open a plugin panel to your application.",
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args;

    if (!id) {
      throw new Error('Id is required');
    }

    const { activePlugin } = useLayout()
    await activePlugin(id)


    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Plugin panel opened successfully`,
            data: {
              id,
              type: 'plugin'
            }
          }
        }
      ]
    };
  },
}
