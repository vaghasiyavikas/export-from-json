import { assert, isArray, normalizeFileName } from './utils'
import { downloadFile } from './processors'
import { _prepareData, _createJSONData, createCSVData, createXLSData, createXMLData, _createFieldsMapper } from './converters'
import ExportType from './ExportType'
export interface IOption<R = void> {
  data: object | string
  fileName?: string
  extension?: string
  fileNameFormatter?: (name: string) => string
  fields?: string[] | Record<string, string>
  exportType?: ExportType
  replacer?: ((key: string, value: any) => any) | Array<number | string> | null,
  space?: string | number
  processor?: (content: string, type: ExportType, fileName: string) => R,
  withBOM?: boolean,
  delimiter?: string
  beforeTableEncode?: (
    tableRow: Array<{ fieldName: string, fieldValues: string[] }>,
  ) => Array<{ fieldName: string, fieldValues: string[]}>,
}

function exportFromJSON<R = void> ({
  data,
  fileName = 'download',
  extension,
  fileNameFormatter = name => name.replace(/\s+/, '_'),
  fields,
  exportType = 'txt',
  replacer = null,
  space = 4,
  processor = downloadFile as any,
  withBOM = false,
  delimiter = ',',
  beforeTableEncode = (i) => i,
}: IOption<R>): R {
  const MESSAGE_IS_ARRAY_FAIL = 'Invalid export data. Please provide an array of object'
  const MESSAGE_UNKNOWN_EXPORT_TYPE = `Can't export unknown data type ${exportType}.`
  const MESSAGE_FIELD_INVALID = `Can't export string data to ${exportType}.`

  if (typeof data === 'string') {
    switch (exportType) {
      case 'txt':
      case 'css':
      case 'html': {
          return processor(data, exportType, normalizeFileName(fileName, extension ?? exportType, fileNameFormatter))
        }
      default:
        throw new Error(MESSAGE_FIELD_INVALID)
    }
  }

  const safeData = data

  const JSONData = _createJSONData(safeData, replacer, space)

  switch (exportType) {
    case 'txt':
    case 'css':
    case 'html': {
      return processor(JSONData, exportType, normalizeFileName(fileName, extension ?? exportType, fileNameFormatter))
    }
    case 'json': {
      return processor(JSONData, exportType, normalizeFileName(fileName, extension ?? 'json', fileNameFormatter))
    }
    case 'csv': {
      assert(isArray(safeData), MESSAGE_IS_ARRAY_FAIL)
      const BOM = '\ufeff'
      const CSVData = createCSVData(safeData, delimiter, beforeTableEncode)
      const content = withBOM ? BOM + CSVData : CSVData

      return processor(content, exportType, normalizeFileName(fileName, extension ?? 'csv', fileNameFormatter))
    }
    case 'xls': {
      assert(isArray(safeData), MESSAGE_IS_ARRAY_FAIL)
      const content = createXLSData(safeData, beforeTableEncode)

      return processor(content, exportType, normalizeFileName(fileName, extension ?? 'xls', fileNameFormatter))
    }
    case 'xml': {
      return processor(safeData, exportType, normalizeFileName(fileName, extension ?? 'xml', fileNameFormatter))
    }
    default:
      throw new Error(MESSAGE_UNKNOWN_EXPORT_TYPE)
  }
}

namespace exportFromJSON {
  export const types: Record<ExportType, ExportType> = {
    txt : 'txt',
    css : 'css',
    html : 'html',
    json : 'json',
    csv : 'csv',
    xls : 'xls',
    xml : 'xml',
  }
  export const processors = { downloadFile }
}

export default exportFromJSON
