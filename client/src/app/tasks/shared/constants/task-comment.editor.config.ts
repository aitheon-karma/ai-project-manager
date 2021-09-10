import { COLORS } from './colors.config';
import { itemRenderer } from '../../../shared/components/rich-text-editor/custom-mention-renderer';

export const COMMENT_EDITOR_CONFIG = {
  toolbar: {
    items: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'link',
      // 'imageUpload',
      'attach',
      '|',
      'removeFormat'
    ],
  },
  fontColor: {
    colors: COLORS,
  },
  fontBackgroundColor: {
    colors: COLORS,
  },
  image: {
    toolbar: [
      'imageTextAlternative',
      'imageStyle:full',
      'imageStyle:side'
    ]
  },
  language: 'en',
  licenseKey: '',
  placeholder: '',
  mention: {
    feeds: [
      {
        marker: '@',
        feed: [] as any,
        minimumCharacters: 0,
        itemRenderer,
      }
    ]
  },
};