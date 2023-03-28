import { Component, Inject, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ViewerComponent } from "@grapecity/activereports-angular";
import { filterValues, dataSetFields } from "./data";
import { ReportService } from "./report-service.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private fb: FormBuilder, private reportService: ReportService) {
    this.tableForm = this.fb.group({
      dataSetName: ["", Validators.required],
      fields: [{ value: [], disabled: true }, Validators.required],
      grouping: [{ value: false, disabled: true }],
      sortBy: [{ value: "", disabled: true }],
      isDescendingSorting: [{ value: false, disabled: true }],
      filterValues: [{ value: [], disabled: true }],
    });
  }
  @ViewChild(ViewerComponent, { static: false })
  reportViewer!: ViewerComponent;
  Mode: "Design" | "Preview" = "Design";
  DataSets: any = ["Products", "Customers"];
  Fields: any = [];
  Filters: any = [];
  tableForm: any;
  ngAfterViewInit() {
    this.tableForm
      .get("dataSetName")
      ?.valueChanges.subscribe((val: "Products" | "Customers") => {
        this.Fields = dataSetFields[val].map((f) => f.name);
        this.Filters = filterValues[val];

        this.tableForm.get("fields")?.setValue([]);
        this.tableForm.get("fields")?.enable();

        this.tableForm.get("grouping")?.setValue(false);
        this.tableForm.get("grouping")?.enable();

        this.tableForm.get("sortBy")?.setValue("");
        this.tableForm.get("sortBy")?.enable();

        this.tableForm.get("isDescendingSorting")?.setValue(false);
        this.tableForm.get("isDescendingSorting")?.enable();

        this.tableForm.get("filterValues")?.setValue([]);
        this.tableForm.get("filterValues")?.enable();
      });
  }
  onSubmit() {
    //console.log(this.tableForm.value);
    this.Mode = "Preview";
  }
  get DataSetName(): string {
    return this.tableForm.get("dataSetName")?.value;
  }
  get GroupingField(): string {
    if (!this.DataSetName) return "...";
    return this.DataSetName === "Products" ? "Product Category" : "Country";
  }
  get FilterField(): string {
    if (!this.DataSetName) return "Values";
    return this.DataSetName === "Products" ? "Product Categories" : "Countries";
  }
  updateToolbar() {
    var designButton = {
      key: "$openDesigner",
      text: "Designer",
      iconCssClass: "mdi mdi-reply",
      enabled: true,
      action: () => {
        this.Mode = "Design";
      },
    };
    this.reportViewer.toolbar.addItem(designButton);
    this.reportViewer.toolbar.updateLayout({
      default: [
        "$openDesigner",
        "$split",
        "$navigation",
        "$split",
        "$refresh",
        "$split",
        "$history",
        "$split",
        "$zoom",
        "$fullscreen",
        "$split",
        "$print",
        "$split",
        "$singlepagemode",
        "$continuousmode",
        "$galleymode",
      ],
    });
  }
  onViewerInit() {
    this.updateToolbar();
    const report = this.reportService.generateReport(this.tableForm.value);
    this.reportViewer.open("report", {
      ResourceLocator: {
        getResource(resource: string) {
          return report as any;
        },
      },
    });
  }
}
