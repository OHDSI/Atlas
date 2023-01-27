define([
    'knockout',
  'numeral',
  '../../utils',
  'lodash',
], function (
  ko,
  numeral,
  utils,
  lodash,
) {


  class BaseStatConverter {

    constructor(classes) {
      this.classes = classes;
    }

    convertAnalysisToTabularData(analysis, stratas = null) {
      let columns = this.getDefaultColumns(analysis);

      const data = new Map();
      const cohorts = Array.from(analysis.cohorts);
      const strataNames = (stratas && stratas.reduce((map, s) => {
        const { strataId, strataName } = this.extractStrata(s);
        return map.set(strataId, strataName);
      }, new Map())) || new Map();

      let mapCovariate;
      mapCovariate = (stat) => {
        let row;
        const rowId = this.getRowId(stat);
        if (!data.has(rowId)) {
          row = this.getResultObject({
            analysisId: analysis.analysisId,
            analysisName: analysis.analysisName,
            domainId: analysis.domainId,
            cohorts: cohorts || [],
            ...stat
          });

          data.set(rowId, row);
        } else {
          row = data.get(rowId);
        }

        const { strataId, strataName } = this.extractStrata(stat);

        if (!strataNames.has(strataId)) {
          strataNames.set(strataId, strataName);
        }

        if (analysis.isComparative) {
          row.stdDiff = this.formatStdDiff(stat.diff);
          this.convertCompareFields(row, strataId, stat);
        } else {
          this.convertFields(row, strataId, stat.cohortId, stat);
        }
      };

      analysis.items.forEach((c, i) => mapCovariate(c));

      cohorts.forEach((c, i) => {
        for (let strataId of utils.sortedStrataNames(strataNames).map(s => s.id)) {
          columns = columns.concat(this.getReportColumns(strataId, c.cohortId));
        }
      });

      const strataOnly = !strataNames.has(0) && data.size > 0;
      const stratified = !(strataNames.has(0) && strataNames.size === 1) && data.size > 0;

      if (!strataOnly && analysis.isComparative) {
        columns.push(this.getStdDiffColumn());
      }

      return {
        type: analysis.type,
        domainIds: analysis.domainIds,
        analysisName: analysis.analysisName,
        analysisId: analysis.analysisId,
        strataOnly,
        stratified,
        cohorts: cohorts,
        isSummary: analysis.isSummary,
        strataNames: strataNames,
        defaultColNames: this.getDefaultColumns().map(col => col.title),
        perStrataColNames: this.getReportColumns(0, 0).map(col => col.title),
                columns: columns.map(col => ({...col, title: ko.unwrap(col.title)})),
        defaultSort: this.getDefaultSort(columns.length, cohorts.length),
        data: Array.from(data.values()),
      };
    }

    getDefaultSort(columnsCount, cohortsCount) {
      return [[columnsCount - 1, "desc"]]; // this is either for Std Diff (in comparison mode) or Pct (in single cohort mode)
    }

    getRowId(stat) {
      throw "Override getRowId with actual implementation";
    }

    extractStrata(stat) {
      throw "Override extractStrata with actual implementation";
    }

    setNestedValue(result, field, strataId, cohortId, value) {
      if (result[field][strataId] === undefined) {
        result[field][strataId] = {};
      }
      result[field][strataId][cohortId] = value;
    }

    getStdDiffColumn() {
      return {
        title: 'Std diff',
        render: (s, p, d) => d.stdDiff,
        className: this.classes('col-dist-std-diff'),
        type: 'numberAbs'
      };
    }

    formatStdDiff(val) {
      if (+val == Infinity || +val == -Infinity) {
        return "";
      }
      else {
        return numeral(val).format('0,0.0000');
      }
    }

    formatPct(val) {
      return numeral(val).format('0.00') + '%';
    }

    getColumn(label, field, strata, cohortId, formatter) {
      return {
        title: label,
        className: field === 'pct' ? 'pct-cell' : '',
        render: (s, p, d) => {
          let res = d[field][strata] && d[field][strata][cohortId] || 0;
          if (p === "display" && formatter) {
            res = formatter(res);
          }
          if (field === 'pct') {
            return `<div class="pct-fill" style="width: ${res}"><div>${res}</div></div>`;
          }
          return res;
        }
      };
    }

    getCountColumn(label, field, strata, cohortId) {
      return this.getColumn(label, field, strata, cohortId, v => numeral(v).format());
    }

    getDecimal2Column(label, field, strata, cohortId) {
      return this.getColumn(label, field, strata, cohortId, v => numeral(v).format('0.00'));
    }

    getPctColumn(label, field, strata, cohortId) {
      return this.getColumn(label, field, strata, cohortId, this.formatPct);
    }
  }

  return BaseStatConverter;
});
