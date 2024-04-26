export default class CsvUtils {
  constructor() {
  }

  static separator = ','.charCodeAt(0);
  static endline = '\n'.charCodeAt(0);

  static splitCsvLine(buffer) {

    let fields = [];
    let field = [];

    for (let i = 0; buffer[i] !== this.endline; ++i) {
      if (buffer[i] === this.separator) {
        fields.push(String.fromCharCode(...field));
        field = [];
      } else {
        field.push(buffer[i]);
      }
    }

    fields.push(String.fromCharCode(...field));
    return fields;
  }
}