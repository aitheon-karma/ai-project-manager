class UploadAdapter {
  constructor(
    private loader: any,
    private uploadImage: any,
  ) {}

  upload() {
    return this.loader.file.then(file => this.uploadImage(file));
  }
}

export const UploadAdapterPlugin = (editor, uploadImage) => {
  editor.plugins.get('FileRepository').createUploadAdapter = loader => new UploadAdapter(loader, uploadImage);
}
