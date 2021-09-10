import { COLORS } from './colors.config'
import { itemRenderer } from '../../../shared/components/rich-text-editor/custom-mention-renderer';

export const DESCRIPTION_EDITOR_CONFIG = {
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'link',
      'imageUpload',
      'horizontalLine',
      '|',
      'undo',
      'redo',
      '|',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'indent',
      'outdent',
      '|',
      'todoList',
      'blockQuote',
      'insertTable',
      '|',
      'removeFormat'
    ],
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Normal text', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
    ]
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
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableCellProperties',
      'tableProperties'
    ]
  },
  language: 'en',
  licenseKey: '',
  placeholder: 'Add task description',
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
