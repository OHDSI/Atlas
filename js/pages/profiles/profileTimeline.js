define(function(require, exports) {
  const moment = require('moment')
  const _ = require('lodash')
  const d3 = require('d3')
  const { schemeCategory10 } = require('d3-scale-chromatic')

  class Timeline {
    constructor(chartContainer) {
      // chart variables
      this.chartContainer = chartContainer

      this.svg

      this.brush

      this.brushed

      this.xDayScale

      this.r = 5

      this.fontSize = 12

      this.domainFontSize = 16

      this.ySpace = 35

      // label space
      this.lineStrokeWidth = 3

      this.truncateLength = 20

      this.margin = {
        top: 30,
        right: 60,
        bottom: 30,
        left: 200,
      }
      this.width =
        document.getElementById(this.chartContainer).offsetWidth -
        this.margin.left -
        this.margin.right

      this.height = 1000

      this.lineStroke = '#CDCDCD'

      this.circleFill = '#CDCDCD'

      this.pinFill = '#467AB2'

      this.expandAllColor = '#467AB2'

      this.textFill = 'black'

      this.pinnedFill = 'blue'

      this.filteredData = []
      this.filterText = ''
      this.axisType = ''
      this.allData = []
      this.originalData = []
      //
      this.updateData = this.updateData.bind(this)
      this.init()
    }

    init() {
      d3.select(`#${this.chartContainer}`)
        .append('div')
        .attr('class', 'profileTimeline')

      this.implementColorScheme()
      this.implementFilter()
      this.implementAxisSelection()
      this.implementExpandingAll()
      this.implementTooltip()

      this.svg = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('svg')
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
        .attr('class', 'timelineChart')

      this.svg
        .append('defs')
        .append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', -this.r)
        .attr('y', -this.r)
      // create day xAxis
      this.svg.append('g').attr('class', 'dayAxis')
      // create date xAxis
      this.svg.append('g').attr('class', 'dateAxis hidden-axis')

      // dayAxis Scale
      this.xDayScale = d3.scaleLinear().range([0, this.width])
      // dateAxis Scale
      this.xDateScale = d3.scaleTime().range([0, this.width])
      // create brush
      this.brush = this.svg.append('g').attr('class', 'brush')
    }

    updateData(rawData) {
      this.allData.splice(
        0,
        this.allData.length,
        ...this.transformedData(rawData)
      )
      const newOriginalData = this.transformedData(rawData).filter(
        timeline => !timeline.belongTo
      )
      this.originalData.splice(0, this.originalData.length, ...newOriginalData)
      this.maxMoment = d3.max(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.endDay)
      )

      this.minMoment = d3.min(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.startDay)
      )

      this.maxDate = d3.max(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.endDate)
      )

      this.minDate = d3.min(
        this.allData
          .map(el => el.observationData)
          .flat()
          .map(el => el.startDate)
      )

      this.updateScale()
      this.drawTimeline(this.originalData)
    }

    updateScale() {
      this.xDayScale.domain([this.minMoment, this.maxMoment])
      // dateAxis Scale
      this.xDateScale.domain([this.minDate, this.maxDate])

      this.svg
        .select(`#${this.chartContainer} .dayAxis`)
        .call(d3.axisBottom(this.xDayScale))
      this.svg
        .select(`#${this.chartContainer} .dateAxis`)
        .call(d3.axisBottom(this.xDateScale))
    }

    implementColorScheme() {
      this.colorScheme = d3
        .scaleOrdinal()
        .domain(this.allData.filter(el => !el.belongTo).map(el => el.id))
        .range(schemeCategory10)
    }

    implementFilter() {
      const input = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .style('text-align', 'left')
        .attr('class', 'timelineFilter')
        .append('input')
        .attr('placeholder', 'Filter timeline')
      d3.select(`#${this.chartContainer} .timelineFilter`).style(
        'padding',
        `${this.margin.top / 2}px 0 0 ${this.margin.left}px`
      )
      input.on('input', _.debounce(() => this.handleFilter(), 200))
    }

    handleFilter() {
      this.filteredData.splice(0, this.filteredData.length)
      const inputVal = d3
        .select(`#${this.chartContainer} .timelineFilter`)
        .select('input')
        .node()
        .value.trim()

      this.filterText = inputVal

      if (inputVal === '') {
        this.handleCollapseAll()
      } else {
        const filteredData = this.allData.filter(
          el =>
            el.belongTo &&
            el.label.toLowerCase().includes(inputVal.toLowerCase())
        )
        if (filteredData.length === 0) {
          this.filterText = ''
          this.handleCollapseAll()
          return
        }
        this.handleExpandingAll()
      }
    }

    implementAxisSelection() {
      const container = d3
        .select(`#${this.chartContainer} .timelineFilter`)
        .append('div')
        .style('text-align', 'right')
        .style('margin-right', `${this.margin.right / 2}px`)

      container
      .append('text')
      .text('Effective date: ')
      .attr('title', 'Turn effective date on to see the events’ effective date instead of the index day.')
      const switcher = container.append('label').attr('class', 'switch')
      const checkbox = switcher.append('input').attr('type', 'checkbox')
      switcher.append('span').attr('class', 'slider round')

      checkbox.on('change', () => this.changeAxisView())
    }

    changeAxisView() {
      const selected = d3.select(`#${this.chartContainer} .switch>input`).node()
        .checked
      this.axisType = selected ? 'Date' : 'Day'
      this.svg.select('.dayAxis').classed('hidden-axis', selected)
      this.svg.select('.dateAxis').classed('hidden-axis', !selected)
    }

    implementExpandingAll() {
      const div = d3
        .select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .attr('class', 'expandingButton')
        .style('text-align', 'left')
        .style('color', this.expandAllColor)
        .style('padding', `${this.margin.top / 3}px 0 0 ${this.margin.left}px`)

      const expandText = div
        .append('text')
        .text('Expand all domains')
        .style('font-size', `${this.fontSize}px`)
        .style('cursor', 'pointer')
      expandText.on('click', () => this.handleExpandingAll())
    }

    handleExpandingAll() {
      // prevent multi expanding
      // if (this.allExpanded) return;
      let expandedData
      if (this.filterText) {
        expandedData = this.allData
          .filter(
            el =>
              !el.belongTo ||
              el.isPinned ||
              (el.belongTo &&
                el.label.toLowerCase().includes(this.filterText.toLowerCase()))
          )
          .map(el => {
            if (!el.belongTo && !el.expanded) return { ...el, expanded: true }
            return el
          })
      } else {
        expandedData = this.allData.map(el => {
          if (!el.belongTo) return { ...el, expanded: true }
          return el
        })
      }
      this.originalData.splice(0, this.originalData.length, ...expandedData)

      this.drawTimeline(this.originalData)
      this.allExpanded = true
    }

    handleCollapseAll() {
      _.remove(this.originalData, el => el.belongTo && !el.isPinned)
      // change domain expanded state
      for (let i = 0; i < this.originalData.length; i += 1) {
        if (!this.originalData[i].belongTo) {
          this.originalData[i].expanded = false
        }
      }
      this.drawTimeline(this.originalData)
    }

    implementTooltip() {
      d3.select(`#${this.chartContainer} .profileTimeline`)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
    }

    expandDomain(domain) {
      let expandedData
      if (this.filterText) {
        expandedData = this.allData
          .filter(el => el.belongTo === domain.label)
          .filter(
            el =>
              el.isPinned ||
              (el.belongTo &&
                el.label.toLowerCase().includes(this.filterText.toLowerCase()))
          )
      } else {
        expandedData = this.allData.filter(el => el.belongTo === domain.label)
      }
      const domainIndex = this.originalData.findIndex(
        el => el.label === domain.label
      )
      this.originalData[domainIndex].expanded = true
      // calculate length of current expanding concepts
      const domainConceptsLength = this.originalData.filter(
        el => el.belongTo === domain.label
      ).length
      this.originalData.splice(
        domainIndex + 1,
        domainConceptsLength,
        ...expandedData
      )
      this.drawTimeline(this.originalData)
    }

    closeDomain(domain) {
      const domainIndex = this.originalData.findIndex(
        el => el.label === domain.label
      )
      this.originalData[domainIndex].expanded = false
      const closingLength = this.originalData.filter(
        el => el.belongTo === domain.label
      ).length
      const existingElement = this.originalData.filter(
        el => el.belongTo === domain.label && el.isPinned
      )
      // _.remove(this.originalData, el => el.belongTo === domain.label && !el.isPinned);
      this.originalData.splice(
        domainIndex + 1,
        closingLength,
        ...existingElement
      )
      this.drawTimeline(this.originalData)
    }

    resetBrush() {
      this.svg.select('.brush').call(this.brushed.move, null)
      this.xDayScale.domain([this.minMoment, this.maxMoment])
      this.xDateScale.domain([this.minDate, this.maxDate])

      this.svg
        .select(`#${this.chartContainer} .dayAxis`)
        .call(d3.axisBottom(this.xDayScale))
      this.svg
        .select(`#${this.chartContainer} .dateAxis`)
        .call(d3.axisBottom(this.xDateScale))
      // update circles
      this.svg.selectAll('circle').attr('cx', d => this.xDayScale(d.startDay))

      // update lines
      this.svg
        .selectAll('.observationLine')
        .attr('x1', d => this.xDayScale(d.startDay))
        .attr('x2', d => this.xDayScale(d.endDay))
    }

    makeBrush() {
      // to handle reset brush
      let idleTimeout
      function idled() {
        idleTimeout = null
      }
      // (re)apply brush
      this.brushed = d3
        .brushX()
        .extent([[0, -this.r], [this.width, this.height]])
        .on('end', () => {
          const extent = d3.event.selection
          if (!extent) {
            if (!idleTimeout) {
              // This allows to wait a little bit
              idleTimeout = setTimeout(idled, 350)
              return
            }
            this.xDayScale.domain([this.minMoment, this.maxMoment])
            this.xDateScale.domain([this.minDate, this.maxDate])
          } else {
            const extentDay0 = this.xDayScale.invert(extent[0])
            const extentDay1 = this.xDayScale.invert(extent[1])

            const extentDate0 = this.xDateScale.invert(extent[0])
            const extentDate1 = this.xDateScale.invert(extent[1])

            this.xDayScale.domain([extentDay0, extentDay1])
            this.xDateScale.domain([extentDate0, extentDate1])
            this.svg.select('.brush').call(this.brushed.move, null)
          }
          // update axis
          this.svg.select('.dayAxis').call(d3.axisBottom(this.xDayScale))
          this.svg.select('.dateAxis').call(d3.axisBottom(this.xDateScale))
          // update circles
          this.svg
            .selectAll('circle')
            .attr('cx', d => this.xDayScale(d.startDay))

          // update lines
          this.svg
            .selectAll('.observationLine')
            .attr('x1', d => this.xDayScale(d.startDay))
            .attr('x2', d => this.xDayScale(d.endDay))
        })

      this.brush.call(this.brushed)
    }

    drawTimeline(chartData) {
      // reset brushed if exists
      if (this.brushed) {
        this.resetBrush()
      }
      // (re)calculate height and width
      this.height = chartData.length * this.ySpace

      // re-assign height and width
      d3.select(`#${this.chartContainer} svg`)
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)

      // (re)calculate axis

      this.svg
        .select('.dayAxis')
        .attr('transform', `translate(0,${this.height})`)
      this.svg
        .select('.dateAxis')
        .attr('transform', `translate(0,${this.height})`)

      // (re)calculate clip path
      this.svg
        .select(`#${this.chartContainer}  rect`)
        .attr('width', this.width + this.r * 2)
        .attr('height', this.height)

      this.makeBrush()

      let timelineParent = this.svg
        .selectAll('.timelineParent')
        .data(chartData, d =>
          d.belongTo ? d.label + d.belongTo + d.isPinned : d.label + d.expanded
        )

      // remove a timeline
      // if not remove timelineChildren, they are still in memory even after being deleted
      timelineParent
        .exit()
        .select('.labelContainers')
        .remove()

      timelineParent
        .exit()
        .select('.timelineChildren')
        .exit()
        .remove()

      timelineParent.exit().remove()

      const timelineParentEnter = timelineParent
        .enter()
        .append('g')
        .attr('class', 'timelineParent')
        .attr('transform', (d, i) => `translate(${0},${i * 2})`)

      const labelContainers = timelineParentEnter
        .append('g')
        .attr('class', 'labelContainers')
      // append timelineChildren to newly added timelinesParent
      timelineParentEnter.append('g').attr('class', 'timelineChildren')

      labelContainers
        .attr(
          'transform',
          (d, i) =>
            `translate(${
              d.belongTo
                ? -this.margin.left + this.truncateLength + 20
                : -this.margin.left + this.truncateLength
            },${this.fontSize / 3})`
        )
        .on('click', (d, i) => {
          if (d.belongTo) {
            this.pinLabel({ ...d, isPinned: !d.isPinned })
          } else if (!d.belongTo && !d.expanded) {
            this.expandDomain(d)
          } else if (!d.belongTo && d.expanded) {
            this.closeDomain(d)
          }
        })

      labelContainers
        .append('text')
        .attr('class', 'fa icon')
        .attr(
          'style',
          d => `font-size: ${!d.belongTo ? this.domainFontSize : this.fontSize}`
        )
        .attr('transform', function(d) {
          if (!d.belongTo) return `translate(0,0)`
          const me = labelContainers.node()
          const x1 = me.getBBox().x + me.getBBox().width / 2 // the center x about which you want to rotate
          const y1 = me.getBBox().y + me.getBBox().height / 2 // the center y about which you want to rotate
          return `rotate(45, ${x1}, ${y1})` // rotate 180 degrees about x and y
        })
        .attr('x', -5)

      labelContainers
        .append('text')
        .attr('class', 'fa label')
        .attr(
          'style',
          d => `font-size: ${!d.belongTo ? this.domainFontSize : this.fontSize}`
        )
        .attr('fill', d => (d.isPinned ? this.pinnedFill : this.textFill))
        .style('text-anchor', 'start')
        .attr('x', 10)

      // merge back to the timelineParent
      timelineParent = timelineParentEnter.merge(timelineParent)
      // update other timeline
      timelineParent
        .attr('transform', (d, i) => `translate(${0},${i * this.ySpace})`)
        .style('alignment-baseline', 'middle')

      timelineParent
        .select('g.labelContainers')
        .select('text.label')
        .text(d => {
          const label = _.truncate(d.label, { length: this.truncateLength })
          return label
        })
        .attr('fill', d => (d.isPinned ? this.pinFill : this.textFill))

      timelineParent
        .select('g.labelContainers')
        .select('text.icon')
        .text(d => {
          if (d.belongTo) {
            return '\uf08d'
          }
          return d.expanded ? `\uf106` : '\uf107'
        })
        .attr('fill', d => (d.isPinned ? this.pinFill : this.textFill))

      // draw circles and lines
      const timelineChildren = timelineParent.select('.timelineChildren')
      // timelineChildren.attr('transform', `translate(${0},${this.r * 2})`)
      timelineChildren.attr('clip-path', 'url(#clip)')

      // draw lines
      const lines = timelineChildren
        .selectAll('line')
        .data(
          d => d.observationData.filter(el => el.endDay !== el.startDay),
          d => d.startDay + d.endDay + d.conceptId
        )

      lines.exit().remove()

      lines
        .enter()
        .append('line')
        .attr('class', 'observationLine')
        .attr('x1', d => this.xDayScale(d.startDay))
        .attr('x2', d => this.xDayScale(d.endDay))
        .attr(
          'style',
          d =>
            `fill: ${
              d.inDomainLine ? this.circleFill : this.colorScheme(d.conceptId)
            }`
        )
        .attr('stroke-width', this.lineStrokeWidth)

      // cicles
      const circles = timelineChildren
        .selectAll('circle')
        .data(d => d.observationData, d => d.startDay + d.endDay + d.conceptId)
      circles.exit().remove()

      circles
        .enter()
        .append('circle')
        .attr('cx', d => {
          return this.xDayScale(d.startDay)
        })
        .attr(
          'style',
          d =>
            `fill: ${
              d.inDomainLine ? this.circleFill : this.colorScheme(d.conceptId)
            }`
        )
        .attr('r', this.r)
        .attr('width', 100)
        .attr('height', 100)
        .on('mouseover', d => {
          // display tooltip
          const singleTimelineData = chartData.filter(el =>
            d.inDomainLine
              ? el.label === d.domain
              : el.label === d.conceptName && d.domain === el.belongTo
          )[0]
          this.showTooltip(singleTimelineData, d)
        })
        .on('mouseout', () => {
          this.hideTooltip()
        })
    }

    pinLabel(d) {
      const originalDataIndex = this.originalData.findIndex(
        el => el.id === d.id && d.belongTo === el.belongTo
      )
      const allDataIndex = this.allData.findIndex(
        el => el.id === d.id && el.belongTo === d.belongTo
      )
      this.allData[allDataIndex].isPinned = d.isPinned
      this.originalData[originalDataIndex].isPinned = d.isPinned
      this.drawTimeline(this.originalData)
    }

    showTooltip(timeLineData, d) {
      const tooltipContent = this.getTooltipContent(
        timeLineData.observationData,
        d
      )

      const tooltip = d3.select(`#${this.chartContainer} .tooltip`)
      tooltip
        .transition()
        .duration(100)
        .style('opacity', 1)

      tooltip.html(tooltipContent)
      const tooltipSize = tooltip.node().getBoundingClientRect()
      var coordinates = d3.mouse(this.svg.node())
      tooltip.style(
        'left',
        coordinates[0] + this.margin.left - tooltipSize.width + 'px'
      )
      tooltip.style('top', coordinates[1] + this.margin.top + 'px')
      return
      // 174 is the width of drawer
      tooltip
        .style('left', `${d3.event.pageX - tooltipSize.width / 2 - 174}px`)
        .style('top', `${d3.event.pageY + 5}px`)
    }

    hideTooltip() {
      const tooltip = d3.select(`#${this.chartContainer} .tooltip`)
      tooltip
        .transition()
        .duration(0)
        .style('opacity', 0)
    }

    getTooltipContent(timelineObservationData, dataPoint) {
      const tooltipContentList = []
      timelineObservationData
        .filter(point => point.startDay === dataPoint.startDay)
        .forEach(point => {
          const pointIndex = tooltipContentList.findIndex(
            p =>
              p.startDay === point.startDay &&
              p.endDay === point.endDay &&
              p.conceptId === point.conceptId
          )
          if (pointIndex > -1) {
            tooltipContentList[pointIndex].frequency += 1
          } else {
            tooltipContentList.push({ ...point, frequency: 1 })
          }
        })
      let tooltipContent = ''
      tooltipContentList.forEach(content => {
        const startTime =
          this.axisType === 'Date'
            ? moment(content.startDate).format('MM-DD-YYYY')
            : content.startDay
        const endTime =
          this.axisType === 'Date'
            ? moment(content.endDate).format('MM-DD-YYYY')
            : content.endDay
        const startEndDifferent = content.startDay !== content.endDay
        tooltipContent += `<div style="margin-bottom:5px">
              <strong>${content.conceptId}</strong> <br />
              <span>${content.conceptName}</span> <br />
              <span>Start: ${startTime} ${
          startEndDifferent ? `- End: ${endTime}` : ''
        }
            </span>, 
              <span>Frequency: ${content.frequency} </span>
            </div>`
      })

      return tooltipContent
    }

    transformedData(data) {
      // const format = d3.timeFormat('%m/%d/%Y');
      const tData = _.transform(
        data,
        // eslint-disable-next-line no-unused-vars
        (accumulator, item, index, originalArr) => {
          const { conceptId, conceptName, domain } = item
          const { endDay, startDay } = item
          const startDate =
            item.startDate || new Date(moment(new Date()).add(startDay, 'days'))
          const endDate =
            item.startDate || new Date(moment(new Date()).add(endDay, 'days'))
          const observationData = {
            endDay,
            startDay,
            endDate,
            startDate,
            conceptId,
            conceptName,
            domain,
          }

          const timeLineDomain = {
            label: domain,
            id: domain,
            observationData: [{ ...observationData, inDomainLine: true }],
            belongTo: null,
            expanded: false,
            hidden: false,
            isPinned: false,
          }

          const timeLine = {
            label: conceptName,
            id: conceptId,
            isPinned: false,
            hidden: false,
            expanded: false,
            observationData: [{ ...observationData }],
            belongTo: domain,
          }

          // push timeline for domain
          const timeLineDomainIndex = accumulator.findIndex(
            el => el.id === domain
          )
          if (timeLineDomainIndex > -1) {
            accumulator[timeLineDomainIndex].observationData.push({
              ...observationData,
              inDomainLine: true,
            })
          } else {
            accumulator.push(timeLineDomain)
          }

          // push timeline for concept
          const timeLineIndex = accumulator.findIndex(
            el => el.id === conceptId && el.belongTo === domain
          )

          if (timeLineIndex > -1) {
            accumulator[timeLineIndex].observationData.push(observationData)
          } else {
            accumulator.push(timeLine)
          }
        },
        []
      )
      return tData
    }

    remove() {
      this.originalData = null
      this.allData = null
      this.filterText = ''
      this.svg.selectAll('*').remove()
      d3.select(`#${this.chartContainer}`)
        .selectAll('*')
        .remove()
    }
    removeInput() {
      document.querySelector(
        `#${this.chartContainer} .switch>input`
      ).checked = false
      this.changeAxisView()

      document.querySelector(
        `#${this.chartContainer} .timelineFilter>input`
      ).value = ''
      this.filteredData.splice(0, this.filteredData.length)
      this.filterText = null
    }
  }

  return Timeline
})
