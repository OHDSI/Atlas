define([
    'knockout',
    'text!./conceptset-metadata.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'faceted-datatable',
    'less!./conceptset-metadata.less',
  ], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
  ) {
  class ConceptsetMetadata extends AutoBind(Component) {
      constructor(params) {
          super(params);
          this.isLoading = ko.observable(true);
          this.data = ko.observable();
          this.getList = params.getList;
          this.delete = params.delete;

          const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
          this.pageLength = params.pageLength || pageLength;
          this.lengthMenu = params.lengthMenu || lengthMenu;
          this.columns = ko.observableArray([
            {
              title: ko.i18n('columns.conceptID', 'Concept Id'),
              data: 'conceptId',
            },
            {
              title: ko.i18n('columns.searchData', 'Search Data'),
              className: this.classes('tbl-col', 'search-data'),
              render: (d, t, r) => {
                  if (r.searchData === null || r.searchData === undefined || !r.searchData) {
                      return 'N/A';
                  } else {
                      return `<p>${JSON.stringify(r.searchData)}</p>`
                  }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.relatedConcepts', 'Related Concepts'),
              data: 'relatedConcepts',
              render: (d, t, r) => {
                  if (r.relatedConcepts === null || r.relatedConcepts === undefined || !r.relatedConcepts) {
                      return 'N/A';
                  } else {
                    return `<p>${r.relatedConcepts}</p>`
                  }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.conceptHierarchy', 'Concept Hierarchy'),
              data: 'conceptHierarchy',
              render: (d, t, r) => {
                if (r.conceptHierarchy === null || r.conceptHierarchy === undefined || !r.conceptHierarchy) {
                    return 'N/A';
                } else {
                  return `<p>${r.conceptHierarchy}</p>`
                }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.conceptSetData', 'ConceptSet Data'),
              render: (d, t, r) => {
                  if (r.conceptSetData === null || r.conceptSetData === undefined) {
                      return 'N/A';
                  } else {
                      return `<p>${JSON.stringify(r.conceptSetData)}</p>`
                  }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.conceptData', 'Concept Data'),
              className:  this.classes('tbl-col', 'concept-data'),
              render: (d, t, r) => {
                  if (r.conceptData === null || r.conceptData === undefined) {
                      return 'N/A';
                  } else {
                      return `<>${JSON.stringify(r.conceptData)}</>`
                  }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.action', 'Action'),
              sortable: false,
              render: function() {
                return `<i class="deleteIcon fa fa-trash" aria-hidden="true"></i>`
              }
            }
          ])
          this.loadData();
      }

      objectMap(obj) {
        const newObject = {};
        Object.keys(obj).forEach((key) => {
          if(typeof obj[key] === 'string'){
          newObject[key] = JSON.parse(obj[key] || null);
          }else{
          newObject[key] = obj[key];
          }
        });
        return newObject;
      }

      async onRowClick(d, e){
        try {
          const { id } = d;
          if(e.target.className === 'deleteIcon fa fa-trash') {
            const res = await this.delete(id);
            if(res){
              this.loadData();
            }
          }
        } catch (ex) {
          console.log(ex);
        } finally {
          this.isLoading(false);
        }
      }

      handleConvertData(arr){
        const newDatas = [];
        (arr || []).forEach(item => {
          newDatas.push(this.objectMap(item))
        })
        return newDatas;
      }

      async loadData() {
        this.isLoading(true);
        try {
          const data = await this.getList();
          this.data(this.handleConvertData(data.data));
        } catch (ex) {
          console.log(ex);
        } finally {
          this.isLoading(false);
        }
      }

  }
    return commonUtils.build('conceptset-metadata', ConceptsetMetadata, view);
});