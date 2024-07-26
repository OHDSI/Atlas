define([
    'knockout',
    'text!./conceptset-annotation.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'faceted-datatable',
    'less!./conceptset-annotation.less',
  ], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
  ) {
  class ConceptsetAnnotation extends AutoBind(Component) {
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
              title: ko.i18n('columns.vocabularyVersion', 'Vocabulary Version'),
              data: 'vocabularyVersion',
              render: (d, t, r) => {
                  if (r.vocabularyVersion === null || r.vocabularyVersion === undefined || !r.vocabularyVersion) {
                      return 'N/A';
                  } else {
                    return `<p>${r.vocabularyVersion}</p>`
                  }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.conceptSetVersion', 'Concept Set Version'),
              data: 'conceptSetVersion',
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
              title: ko.i18n('columns.createdBy', 'Created By'),
              data: 'createdBy',
              render: (d, t, r) => {
                if (r.createdBy === null || r.createdBy === undefined || !r.createdBy) {
                    return 'N/A';
                } else {
                  return `<p>${r.createdBy}</p>`
                }
              },
              sortable: false
            },
            {
              title: ko.i18n('columns.createdDate', 'Created Date'),
              render: (d, t, r) => {
                  if (r.createdDate === null || r.createdDate === undefined) {
                      return 'N/A';
                  } else {
                      return `<p>${r.createdDate}</p>`
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
      const keysNotToParse = ['createdBy', 'createdDate', 'vocabularyVersion', 'conceptSetVersion'];
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string' && !keysNotToParse.includes(key)) {
          newObject[key] = JSON.parse(obj[key] || null);
        } else {
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
    return commonUtils.build('conceptset-annotation', ConceptsetAnnotation, view);
});