import { z } from 'zod';
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry, e.g. lowcode.36223242'),
  zh_CN: z
    .string()
    .describe('The Chinese translation text'),
  en_US: z.string().describe('The English translation text')
});

const i18nApi = '/app-center/api/i18n/entries'

const addI18n = {
  name: 'add_i18n',
  label: 'Add I18n Entry',
  order: 6,
  description:
    "Add a new i18n entry to the current TinyEngine low-code application. Use this when you need to add new internationalization translations to your application.",
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { key, zh_CN, en_US } = args;

    if (!key) {
      throw new Error('Key is required');
    }

    if (!zh_CN) {
      throw new Error('zh_CN is required');
    }

    if (!en_US) {
      throw new Error('en_US is required');
    }

    const res = await getMetaApi(META_SERVICE.Http).post(`${i18nApi}/create`, {
      host: "1",
      host_type: 'app',
      key,
      contents: {
        zh_CN,
        en_US
      }
    })

    console.log('res', res)

    return {
      content: [
        {
          type: 'text',
          text: `I18n entry created successfully: ${key}`
        }
      ]
    };
  },
}

export const i18nTools = [addI18n]