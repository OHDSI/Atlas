define([
    'knockout',
    'text!./conceptset-lock-history.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'services/AuthAPI',
    'services/ConceptSet',
    'faceted-datatable',
    'less!./conceptset-lock-history.less',
  ], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    authApi,
    conceptSetService,
  ) {
  class ConceptsetLockHistory extends AutoBind(Component) {
      constructor(params) {
          super(params);
          this.isLoading = ko.observable(true);
          this.snapshotHistory = ko.observable();
          this.canDeleteSnapshots = ko.observable(false);
       //   this.getList = params.getList;
        //  this.delete = params.delete;
        //  this.canDeleteSnapshots = params.canDeleteSnapshots;

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
                render: (d, t, r) => {
                    if (r.snapshotDate === null || r.snapshotDate === undefined) {
                        return 'N/A';
                    } else {
                        return `<p>${r.snapshotDate}</p>`
                    }
                },
                sortable: false
              },
              {
                title: ko.i18n('columns.user', 'User'),
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
              //  className: this.classes('tbl-col', 'search-data'),
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
          
          this.loadData();
      }

    // objectMap(obj) {
    //   const newObject = {};
    //   const keysNotToParse = ['createdBy', 'createdDate', 'vocabularyVersion', 'conceptSetVersion', 'copiedFromConceptSetIds', 'searchData'];
    //   Object.keys(obj).forEach((key) => {
    //     if (typeof obj[key] === 'string' && !keysNotToParse.includes(key)) {
    //       newObject[key] = JSON.parse(obj[key] || null);
    //     } else {
    //       newObject[key] = obj[key];
    //     }
    //   });
    //   return newObject;
    // }

      async onRowClick(d, e){
        // try {
        //   const { id } = d;
        //   if(e.target.className === 'deleteIcon fa fa-trash') {
        //     const res = await this.delete(id);
        //     if(res){
        //       this.loadData();
        //     }
        //   }
        // } catch (ex) {
        //   console.log(ex);
        // } finally {
        //   this.isLoading(false);
        // }
      }

      // handleConvertData(arr){
      //   const newDatas = [];
      //   (arr || []).forEach(item => {
      //     newDatas.push(this.objectMap(item))
      //   })
      //   return newDatas;
      // }

      async loadData() {
        this.isLoading(true);
        try {
          const data = await conceptSetService.listConceptSetSnapshots();
          this.snapshotHistory(data.data);
      //    this.data(this.handleConvertData(data.data));
        } catch (ex) {
          console.log(ex);
        } finally {
          this.isLoading(false);
        }
      }

  }
    return commonUtils.build('conceptset-lock-history', ConceptsetLockHistory, view);
});