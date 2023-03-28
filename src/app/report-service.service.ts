import { Injectable } from "@angular/core";
import { Rdl as ARJS } from "@grapecity/activereports/core";
import { dataSetFields, dataUrl, categories, DataSetName } from "./data";

/**
 * Utility function that converts given number to a Length unit using inches as a unit of measure
 * @see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Report-Items/Common-Properties/index#length
 */
function inches(val: number): string {
  return `${val}in`;
}

/**
 * Utility function that converts given number to a Length unit using points as a unit of measure
 * @see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Report-Items/Common-Properties/index#length
 */
function points(val: number): string {
  return `${val}pt`;
}

/**
 * Utility function that converts given field name to an expression in Rdl format
 */
function fieldVal(fieldName: string): string {
  return `=Fields!${fieldName}.Value`;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor() { }

  private async getDataSource(
    dataSetName: DataSetName
  ): Promise<ARJS.DataSource> {
    // use Web Api to retrieve the data from the demodata API
    const data = await fetch(dataUrl[dataSetName]).then((res) => res.json());

    // patch the product dataset to include category names
    if (dataSetName === "Products") {
      data.value = data.value.map((product: any) => ({
        ...product,
        CategoryName: categories.filter(
          (x) => x.CategoryId === product.CategoryId
        )[0].CategoryName,
      }));
    }

    // construct the data source instance and embed the retrieved data
    // see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Databinding#embedded-json-data-source
    const dataSource: ARJS.DataSource = {
      Name: "DataSource",
      ConnectionProperties: {
        DataProvider: "JSONEMBED",
        ConnectString: `jsondata=${JSON.stringify(data.value)}`,
      },
    };
    return dataSource;
  }

  /**
   * Creates a dataset that reads the data of the data source
   * see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Databinding#data-set-configuration
   */
  private getDataSet(dataSetName: DataSetName): ARJS.DataSet {
    const dataSet: ARJS.DataSet = {
      Name: dataSetName,
      Query: {
        CommandText: "$.*",
        DataSourceName: "DataSource",
      },
      Fields: dataSetFields[dataSetName].map((f) => ({
        Name: f.name,
        DataField: f.name,
      })),
    };
    return dataSet;
  }

  private getFieldInfo(dataSetName: DataSetName, fieldName: string): any {
    return dataSetFields[dataSetName].filter(
      (field: any) => field.name === fieldName
    )[0];
  }

  private getGroupAndFilter(dataSetName: DataSetName): string {
    return dataSetName === "Customers"
      ? fieldVal("Country")
      : fieldVal("CategoryName");
  }

  public async generateReport(
    structure: ReportStructure
  ): Promise<ARJS.Report> {
    // create Table Data region
    // see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Report-Items/Data-Regions/Table/index
    const table: ARJS.Table = {
      Name: `Table_${structure.dataSetName}`,
      DataSetName: structure.dataSetName,
      Type: "table",
      TableColumns: structure.fields.map((f) => ({
        Width: inches(
          (7.5 * this.getFieldInfo(structure.dataSetName, f).len) / 100
        ),
      })),
    };

    // set table filters if the corresponding option was selected
    if (structure.filterValues.length) {
      table.Filters = [
        {
          FilterExpression: this.getGroupAndFilter(structure.dataSetName),
          FilterValues: structure.filterValues,
          Operator: "In",
        },
      ];
    }

    // create column headers for selected fields
    const columnHeadersRow: ARJS.TableRow = {
      Height: inches(0.5),
      TableCells: structure.fields.map((f) => ({
        Item: {
          Type: "textbox",
          Name: `textbox_header_${f}`,
          Value: `${f}`,
          CanGrow: true,
          Style: {
            BottomBorder: {
              Width: points(0.25),
              Style: "solid",
              Color: "Gainsboro",
            },
            Color: "#3da7a8",
            VerticalAlign: "middle",
            FontWeight: "bold",
            PaddingLeft: points(6),
            FontSize: points(10),
            TextAlign:
              this.getFieldInfo(structure.dataSetName, f).type === "text"
                ? "left"
                : "right",
          },
        },
      })),
    };

    // if no grouping was set, then add the column headers into the table header
    if (!structure.grouping) {
      table.Header = {
        RepeatOnNewPage: true,
        TableRows: [columnHeadersRow],
      };
    }

    // create table group that has the group header displaying the current group value
    if (structure.grouping) {
      table.TableGroups = [
        {
          Group: {
            GroupExpressions: [this.getGroupAndFilter(structure.dataSetName)],
            PageBreak: "Between",
          },
          Header: {
            RepeatOnNewPage: true,
            TableRows: [
              {
                Height: inches(0.6),
                TableCells: [
                  {
                    ColSpan: structure.fields.length,
                    AutoMergeMode: "Always",
                    Item: {
                      Type: "textbox",
                      Name: "textbox_group_value",
                      Value: this.getGroupAndFilter(structure.dataSetName),
                      Style: {
                        VerticalAlign: "middle",
                        FontWeight: "bold",
                        PaddingLeft: points(6),
                        FontSize: points(16),
                      },
                    },
                  },
                ],
              },
              columnHeadersRow,
            ],
          },
        },
      ];
    }

    // create table details that display for each row of the data
    table.Details = {
      SortExpressions: structure.sortBy
        ? [
            {
              Value: fieldVal(structure.sortBy),
              Direction: structure.isDescendingSorting
                ? "Descending"
                : "Ascending",
            },
          ]
        : [],
      TableRows: [
        {
          Height: inches(0.3),
          TableCells: structure.fields.map((f: string) => ({
            Item: {
              Type: "textbox",
              Name: `textbox_value_${f}`,
              Value: fieldVal(f),
              CanGrow: true,
              KeepTogether: true,
              Style: {
                VerticalAlign: "middle",
                PaddingLeft: points(6),
                Format:
                  this.getFieldInfo(structure.dataSetName, f).type ===
                  "currency"
                    ? "c2"
                    : "",
                TextAlign:
                  this.getFieldInfo(structure.dataSetName, f).type === "text"
                    ? "left"
                    : "right",
              },
            },
          })),
        },
      ],
    };
    // finally create a report with the table in the body and the report title in the page header
    const report: ARJS.Report = {
      DataSources: [await this.getDataSource(structure.dataSetName)],
      DataSets: [this.getDataSet(structure.dataSetName)],
      Page: {
        TopMargin: inches(0.5),
        BottomMargin: inches(0.5),
        LeftMargin: inches(0.5),
        RightMargin: inches(0.5),
        PageWidth: inches(8.5),
        PageHeight: inches(11),
      },
      Body: {
        ReportItems: [table],
      },
      PageHeader: {
        Height: inches(1),
        ReportItems: [
          {
            Type: "textbox",
            Name: "textbox_report_name",
            Value:
              structure.dataSetName === "Customers"
                ? "Customer List"
                : "Product List",
            Style: {
              FontSize: points(22),
              Color: "#3da7a8",
              VerticalAlign: "middle",
              TextAlign: "left",
            },
            Left: points(6),
            Top: points(0),
            Width: inches(7.5),
            Height: inches(1),
          },
        ],
      },
      Width: inches(7.5),
    };
    //console.log(JSON.stringify(report));
    return report;
  }
}

export interface ReportStructure {
  dataSetName: DataSetName;
  fields: string[];
  grouping: boolean;
  sortBy: string;
  isDescendingSorting: boolean;
  filterValues: string[];
}