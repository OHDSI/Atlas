define([
  'knockout',
  'text!./conceptset-lock-history.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'services/ConceptSet',
  'utils/Renderers',
  'services/MomentAPI',
  'faceted-datatable',
  'less!./conceptset-lock-history.less',
], function (
  ko,
  view,
  Component,
  AutoBind,
  commonUtils,
  conceptSetService,
  renderers,
  momentAPI,
) {
  class ConceptsetLockHistory extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.currentConceptSet = params.currentConceptSet();

      this.isLoading = ko.observable(true);
      this.snapshotHistory = ko.observable();
      this.canDeleteSnapshots = ko.observable(false);
      this.datatableLanguage = ko.i18n('datatable.language');
      this.commonUtils = commonUtils;

      const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
      this.pageLength = params.pageLength || pageLength;
      this.lengthMenu = params.lengthMenu || lengthMenu;

      this.snapshotHistoryColumns = ko.computed(() => {
        let cols = [
          {
            title: ko.i18n('columns.action', 'Action'),
            data: 'action',
            sortable: false,
          },
          {
            title: ko.i18n('columns.snapshotDate', 'Snapshot Date'),
            data: 'snapshotDate',
            render: (d, t, r) => {
              if (t === 'sort' || t === 'type') {
                return d ? new Date(d).getTime() : 0; // to avoid incorrect sorting by date in string representation
              }
              if (r.snapshotDate === null || r.snapshotDate === undefined) {
                return 'N/A';
              } else {
                return `<p>${momentAPI.formatDateTimeUTC(r.snapshotDate, true)}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.createdBy', 'Created By'),
            data: 'user',
            render: (d, t, r) => {
              if (r.user === null || r.user === undefined || !r.user) {
                return 'N/A';
              } else {
                return `<p>${r.user}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.vocabularyBundleName', 'Vocabulary Bundle Name'),
            data: 'vocabularyBundleName',
            render: (d, t, r) => {
              if (r.vocabularyBundleName === null || r.vocabularyBundleName === undefined || !r.vocabularyBundleName) {
                return 'N/A';
              } else {
                return `<p>${r.vocabularyBundleName}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.vocabularyBundleSchema', 'Vocabulary Bundle Schema'),
            data: 'vocabularyBundleSchema',
            render: (d, t, r) => {
              if (r.vocabularyBundleSchema === null || r.vocabularyBundleSchema === undefined || !r.vocabularyBundleSchema) {
                return 'N/A';
              } else {
                return `<p>${r.vocabularyBundleSchema}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.vocabularyBundleVersion', 'Vocabulary Bundle Version'),
            data: 'vocabularyBundleVersion',
            render: (d, t, r) => {
              if (r.vocabularyBundleVersion === null || r.vocabularyBundleVersion === undefined || !r.vocabularyBundleVersion) {
                return 'N/A';
              } else {
                return `<p>${r.vocabularyBundleVersion}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.conceptSetVersion', 'Concept Set Version'),
            render: (d, t, r) => {
              if (r.conceptSetVersion === null || r.conceptSetVersion === undefined || !r.conceptSetVersion) {
                return 'N/A';
              } else {
                return `<p>${r.conceptSetVersion}</p>`
              }
            },
            sortable: false
          },
          {
            title: ko.i18n('columns.message', 'Message'),
            data: 'message',
            render: (d, t, r) => {
              if (r.message === null || r.message === undefined || !r.message) {
                return 'N/A';
              } else {
                return `<p>${r.message}</p>`
              }
            },
            sortable: false
          },
        ];

        if (this.canDeleteSnapshots()) {
          cols.push({
            title: ko.i18n('columns.delete', 'Delete'),
            sortable: false,
            render: function () {
              return `<i class="deleteIcon fa fa-trash" aria-hidden="true"></i>`;
            }
          });
        }
        return cols;
      });



      this.selectedSnapshotId = ko.observable();
      this.expressionItems = ko.observableArray([]);
      this.includedConcepts = ko.observableArray([]);
      this.includedSourceCodes = ko.observableArray([]);


      this.selectedTab = ko.observable(0);
      this.tabs = [{
        title: ko.i18n('cs.manager.tabs.conceptSetExpression', 'Concept Set Expression'),
        componentParams: { data: this.expressionItems },
      },
      {
        title: ko.i18n('cs.manager.tabs.includedConcepts', 'Included Concepts'),
        componentParams: { snapshotId: this.selectedSnapshotId },
      },
      {
        title: ko.i18n('cs.manager.tabs.includedSourceCodes', 'Source Codes'),
        componentParams: { snapshotId: this.selectedSnapshotId },
      },
      ];

      this.selectedTab.subscribe(() => {
        if (this.selectedSnapshotId()) {
          this.loadTabData();
        }
      });

      this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
      this.expressionItemColumns = [
        {
          title: ko.i18n('columns.conceptId', 'Concept Id'),
          sortable: true,
          data: 'concept.CONCEPT_ID',
        },
        {
          title: ko.i18n('columns.conceptCode', 'Concept Code'),
          sortable: true,
          data: 'concept.CONCEPT_CODE',
        },
        {
          title: ko.i18n('columns.conceptName', 'Concept Name'),
          sortable: true,
          data: 'concept.CONCEPT_NAME',
        },
        {
          title: ko.i18n('columns.domain', 'Domain'),
          sortable: true,
          data: 'concept.DOMAIN_ID',
        },
        {
          title: ko.i18n('columns.standardConceptCode', 'Standard Concept Code'),
          sortable: true,
          data: 'concept.STANDARD_CONCEPT',
        },
        {
          title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
          sortable: true,
          data: 'concept.STANDARD_CONCEPT_CAPTION',
        },
        {
          title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
          render: (s, type, d) => type === "sort" ? +d['concept.VALID_START_DATE'] :
            momentAPI.formatDateTimeWithFormat(d['concept.VALID_START_DATE'], momentAPI.DATE_FORMAT),
          visible: false
        },
        {
          title: ko.i18n('columns.validEndDate', 'Valid End Date'),
          render: (s, type, d) => type === "sort" ? +d['concept.VALID_END_DATE'] :
            momentAPI.formatDateTimeWithFormat(d['concept.VALID_END_DATE'], momentAPI.DATE_FORMAT),
          visible: false
        },
        {
          title: ko.i18n('columns.excluded', 'Excluded'),
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('isExcluded'),
        },
        {
          title: ko.i18n('columns.descendants', 'Descendants'),
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('includeDescendants'),
        },
        {
          title: ko.i18n('columns.mapped', 'Mapped'),
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('includeMapped'),
        },
      ];

      this.conceptColumns = [
        {
          title: ko.i18n('columns.conceptId', 'Concept Id'),
          sortable: true,
          data: 'concept.CONCEPT_ID',
        },
        {
          title: ko.i18n('columns.conceptCode', 'Concept Code'),
          sortable: true,
          data: 'concept.CONCEPT_CODE',
        },
        {
          title: ko.i18n('columns.conceptName', 'Concept Name'),
          sortable: true,
          data: 'concept.CONCEPT_NAME',
        },
        {
          title: ko.i18n('columns.domain', 'Domain'),
          sortable: true,
          data: 'concept.DOMAIN_ID',
        },
        {
          title: ko.i18n('columns.standardConceptCode', 'Standard Concept Code'),
          sortable: true,
          data: 'concept.STANDARD_CONCEPT',
          visible: false,
        },
        {
          title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
          sortable: true,
          data: 'concept.STANDARD_CONCEPT_CAPTION',
        },
        {
          title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
          render: (s, type, d) => type === "sort" ? +d.concept['VALID_START_DATE'] :
            momentAPI.formatDateTimeWithFormat(d.concept['VALID_START_DATE'], momentAPI.DATE_FORMAT),
          visible: false
        },
        {
          title: ko.i18n('columns.validEndDate', 'Valid End Date'),
          render: (s, type, d) => type === "sort" ? +d.concept['VALID_END_DATE'] :
            momentAPI.formatDateTimeWithFormat(d.concept['VALID_END_DATE'], momentAPI.DATE_FORMAT),
          visible: false
        },
      ];

      this.loadData();
    }

    renderCheckbox(field) {
      return renderers.renderConceptSetCheckbox(false, field);
    }

    async loadConceptSetExpression() {
      if (this.selectedSnapshotId()) {
        this.isLoading(true);
        try {
          const getConceptSetSnapshotItemsRequest = {
            snapshotId: [this.selectedSnapshotId()]
          };
          let items = await conceptSetService.getConceptSetSnapshotItems(getConceptSetSnapshotItemsRequest);
          this.conceptSetItems(items);
        } catch (error) {
          console.error(`Error loading concept set expression data: ${error.message}`);
        } finally {
          this.isLoading(false);
        }
      }
    }

    async loadConceptSetSnapshotDetails(tabIndex) {
      this.isLoading(true);
      try {
        let data;
        if (tabIndex === 1) {
          data = await conceptSetService.fetchSnapshotIncludedConcepts(this.selectedSnapshotId());
        } else if (tabIndex === 2) {
          data = await conceptSetService.fetchSnapshotIncludedSourceCodes(this.selectedSnapshotId());
        }
        this.tabs[tabIndex].componentParams.data(data);
      } catch (error) {
        console.error(`Error loading data for tab ${this.tabs[tabIndex].title}: ${error.message}`);
      } finally {
        this.isLoading(false);
      }
    }

    async onRowClick(data, event) {
      $(event.currentTarget).closest('table').find('tr').removeClass('highlighted');
      $(event.currentTarget).addClass('highlighted');
      this.selectedSnapshotId(data.snapshotId);
      this.loadTabData();
    }

    async loadTabData() {
      const snapshotId = this.selectedSnapshotId();
      let snapshotItemType;
      switch (this.selectedTab()) {
        case 0: snapshotItemType = 'EXPRESSION_ITEMS'; break;
        case 1: snapshotItemType = 'CONCEPTS'; break;
        case 2: snapshotItemType = 'SOURCE_CODES'; break;
      }
      const getConceptSetSnapshotItemsRequest = {
        snapshotId: snapshotId,
        snapshotItemType: snapshotItemType
      };
      try {
        const result = await conceptSetService.getConceptSetSnapshotItems(getConceptSetSnapshotItemsRequest);
        const conceptSetItems = result.json?.conceptSetItems || [];
        // Load respective tab data
        if (this.selectedTab() === 0) {
          this.expressionItems(conceptSetItems);
        } else if (this.selectedTab() === 1) {
          this.includedConcepts(conceptSetItems);
        } else { // Tab 2
          this.includedSourceCodes(conceptSetItems);
        }

        this.isLoading(false);
      } catch (error) {
        console.error(`Error loading data for tab: ${error.message}`);
        this.isLoading(false);
      }
    }

    async loadData() {
      this.isLoading(true);
      try {
        const data = await conceptSetService.listConceptSetSnapshots(this.currentConceptSet.id);
        this.snapshotHistory(data.data);
      } catch (ex) {
        console.error(`Error refreshing snapshots: ${ex}`);
      } finally {
        this.isLoading(false);
      }
    }

  }
  return commonUtils.build('conceptset-lock-history', ConceptsetLockHistory, view);
});