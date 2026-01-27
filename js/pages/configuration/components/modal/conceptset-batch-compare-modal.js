define([
    'knockout',
    'text!./conceptset-batch-compare-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'utils/DatatableUtils',
    'services/ConceptSet',
    'services/AuthAPI',
    'services/Tags',
    'services/User',
    'services/Vocabulary',
    'atlas-state',
    'less!./conceptset-batch-compare-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    datatableUtils,
    conceptSetService,
    authApi,
    TagsService,
    UserService,
    vocabularyService,
    sharedState,
) {
    class ConceptSetBatchCompareModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            
            this.isModalShown = params.isModalShown || ko.observable(false);
            
            // Vocabulary sources
            this.vocabularySources = ko.computed(() => {
                const vocabularySources = [];
                sharedState.sources().forEach((source) => {
                    if (source.hasVocabulary && authApi.isPermittedAccessSource(source.sourceKey)) {
                        vocabularySources.push({
                            sourceKey: source.sourceKey,
                            sourceName: source.sourceName,
                            version: source.version() || ''
                        });
                    }
                });
                return vocabularySources;
            });

            // Selected vocabularies
            this.selectedBaseVocabulary = ko.observable(null);
            this.selectedTargetVocabulary = ko.observable(null);

            // Initialize with current vocabulary if available
            if (this.vocabularySources().length > 0) {
                const currentSourceKey = sharedState.sourceKeyOfVocabUrl();
                const currentSource = this.vocabularySources().find(s => s.sourceKey === currentSourceKey);
                
                if (currentSource) {
                    this.selectedBaseVocabulary(currentSource);
                } else {
                    this.selectedBaseVocabulary(this.vocabularySources()[0]);
                }
            }

            // Display computed observables
            this.selectedBaseVocabularyDisplay = ko.pureComputed(() => {
                const selected = this.selectedBaseVocabulary();
                return selected ? `[${selected.sourceName}] ${selected.version}` : ko.i18n('components.batchCompare.selectVocabulary', 'Select Vocabulary')();
            });

            this.selectedTargetVocabularyDisplay = ko.pureComputed(() => {
                const selected = this.selectedTargetVocabulary();
                return selected ? `[${selected.sourceName}] ${selected.version}` : ko.i18n('components.batchCompare.selectVocabulary', 'Select Vocabulary')();
            });

            // Vocabulary validation
            this.vocabularySelectionError = ko.pureComputed(() => {
                const base = this.selectedBaseVocabulary();
                const target = this.selectedTargetVocabulary();
                return base && target && base.sourceKey === target.sourceKey;
            });

            // Date filters with operators
            this.createdDateOperator = ko.observable('between');
            this.createdDateFrom = ko.observable('');
            this.createdDateTo = ko.observable('');
            
            this.updatedDateOperator = ko.observable('between');
            this.updatedDateFrom = ko.observable('');
            this.updatedDateTo = ko.observable('');

            // Author filter - Multi-select
            this.availableAuthors = ko.observableArray();
            this.selectedAuthors = ko.observableArray();
            this.showAuthorsModal = ko.observable(false);
            this.authorsMessage = ko.observable();
            this.tableOptions = commonUtils.getTableOptions('S');

            this.isLoadingAuthors = ko.observable(false);
            this.isLoadingTags = ko.observable(false);

            // Helper function to escape HTML attributes
            const escapeAttr = (str) => {
                if (!str) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/'/g, '&#39;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            };

            // Helper function to escape HTML content
            const escapeHtml = (str) => {
                if (!str) return '';
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            };

            // Author columns configuration
            this.availableAuthorsColumns = [
                {
                    title: '',
                    width: '20px',
                    sortable: false,
                    searchable: false,
                    render: (s, p, d) => {
                        if (!d) return '';
                        d.select = () => {
                            if (!d.selected()) {
                                this.authorsMessage('');
                                d.selected(true);
                            } else {
                                d.selected(false);
                            }
                        };
                        return `<span data-bind="click: select, css: { selected: selected }" class="fa fa-check"></span>`;
                    },
                },
                {
                    title: ko.unwrap(ko.i18n('columns.name', 'Name')),
                    width: '150px',
                    data: 'name',
                    searchable: true, 
                    render: (s, p, d) => {
                        if (!d) return '';
                        const displayName = d.name || d.login || '';
                        const escapedName = escapeAttr(displayName);
                        const escapedHtml = escapeHtml(displayName);
                        return `<span class="cell-author-name" title="${escapedName}">${escapedHtml}</span>`;
                    }
                },
                {
                    title: ko.unwrap(ko.i18n('columns.login', 'Login')),
                    width: '120px',
                    data: 'login',
                    searchable: true,
                    render: (s, p, d) => {
                        if (!d) return '';
                        const login = d.login || '';
                        const escapedLogin = escapeAttr(login);
                        const escapedHtml = escapeHtml(login);
                        return `<span class="cell-author-login" title="${escapedLogin}">${escapedHtml}</span>`;
                    }
                }
            ];

            // Tags - Multi-select
            this.availableTags = ko.observableArray();
            this.selectedTags = ko.observableArray();
            this.showTagsModal = ko.observable(false);
            this.tagsMessage = ko.observable();

            // Tag columns configuration
            this.availableTagsColumns = [
                {
                    title: '',
                    width: '20px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.select = () => {
                            if (!d.selected()) {
                                this.tagsMessage('');
                                d.selected(true);
                            } else {
                                d.selected(false);
                            }
                        };
                        return `<span data-bind="click: select, css: { selected: selected }" class="fa fa-check"></span>`;
                    },
                },
                {
                    title: ko.i18n('columns.group', 'Group'),
                    width: '100px',
                    render: (s, p, d) => {
                        const groupName = d.groups && d.groups[0] ? d.groups[0].name : '';
                        const escapedGroupName = escapeAttr(groupName);
                        const escapedHtml = escapeHtml(groupName);
                        return `<span class="cell-tag-name" title="${escapedGroupName}">${escapedHtml}</span>`;
                    }
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    render: (s, p, d) => {
                        const tagName = d.name || '';
                        const color = d.color || (d.groups && d.groups[0] && d.groups[0].color) || '#cecece';
                        const icon = d.icon || (d.groups && d.groups[0] && d.groups[0].icon) || 'fa fa-tag';
                        const displayName = tagName.length > 22 ? tagName.substring(0, 20) + '...' : tagName;
                        const escapedTagName = escapeAttr(tagName);
                        const escapedHtml = escapeHtml(displayName);
                        return `<span class="tag" style="background-color: ${color}">
                            <i class="${icon}"></i>
                            <span title="${escapedTagName}">${escapedHtml}</span>
                        </span>`;
                    }
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    width: '225px',
                    render: (s, p, d) => {
                        const desc = d.description || '-';
                        const escapedDesc = escapeAttr(desc);
                        const escapedHtml = escapeHtml(desc);
                        return `<span class="cell-tag-description" title="${escapedDesc}">${escapedHtml}</span>`;
                    }
                }
            ];

            this.isLoadingConceptSets = ko.observable(false);
            this.conceptSetsMessage = ko.observable();

            // Concept Set columns configuration
            this.availableConceptSetsColumns = [
                {
                    title: '',
                    width: '20px',
                    sortable: false,
                    searchable: false,
                    render: (s, p, d) => {
                        if (!d) return '';
                        d.select = () => {
                            if (!d.selected()) {
                                this.conceptSetsMessage('');
                                d.selected(true);
                            } else {
                                d.selected(false);
                            }
                        };
                        return `<span data-bind="click: select, css: { selected: selected }" class="fa fa-check"></span>`;
                    },
                },
                {
                    title: ko.unwrap(ko.i18n('columns.id', 'ID')),
                    width: '80px',
                    data: 'id',
                    searchable: true,
                },
                {
                    title: ko.unwrap(ko.i18n('columns.name', 'Name')),
                    data: 'name',
                    searchable: true,
                    render: (s, p, d) => {
                        if (!d) return '';
                        const name = d.name || '';
                        const escapedName = escapeAttr(name);
                        const escapedHtml = escapeHtml(name);
                        return `<span class="cell-name" title="${escapedName}">${escapedHtml}</span>`;
                    }
                }
            ];

            // Compare source codes checkbox
            this.compareSourceCodes = ko.observable(true);

            // Execution state
            this.isExecuting = ko.observable(false);
            this.actionInProgress = ko.observable('');

            // Can execute validation
            this.canExecute = ko.pureComputed(() => {
                const hasBaseVocab = this.selectedBaseVocabulary() !== null;
                const hasTargetVocab = this.selectedTargetVocabulary() !== null;
                const vocabsAreDifferent = !this.vocabularySelectionError();
                
                // Check if at least one filter criterion is provided
                const hasDateFilter = !!(
                    this.createdDateFrom() || 
                    this.createdDateTo() || 
                    this.updatedDateFrom() || 
                    this.updatedDateTo()
                );
                
                const hasAuthorFilter = this.selectedAuthors().length > 0;
                const hasTagFilter = this.selectedTags().length > 0;
                const hasConceptSetIdFilter = this.conceptSetIdsForFilter().length > 0;
                
                // At least one filter must be active
                const hasAnyFilter = hasDateFilter || hasAuthorFilter || hasTagFilter || hasConceptSetIdFilter;
                
                return hasBaseVocab && hasTargetVocab && vocabsAreDifferent && hasAnyFilter;
            });

            // Load tags and authors when modal is shown
            this.isModalShown.subscribe(open => {
                if (open) {
                    this.loadAvailableTags();
                    this.loadAvailableAuthors();
                } else {
                    // Clear everything when modal is closed
                    this.resetForm();
                }
            });

            this.isCheckingCount = ko.observable(false);
            this.filterCount = ko.observable(null);
            this.filterCountMessage = ko.observable('');

            // Subscribe to filter changes to clear the count
            const clearFilterCount = () => {
                this.filterCount(null);
                this.filterCountMessage('');
            };

           // Concept Set IDs Filter
            this.conceptSetIdsText = ko.observable('');
            this.selectedConceptSetIds = ko.observableArray();
            this.availableConceptSetsForFilter = ko.observableArray();
            this.showConceptSetSelectorModal = ko.observable(false);

            // Track which mode is active
            this.isTextModeActive = ko.pureComputed(() => {
                return this.conceptSetIdsText().trim().length > 0;
            });

            this.isSelectorModeActive = ko.pureComputed(() => {
                return this.selectedConceptSetIds().length > 0;
            });

            this.conceptSetIdsFromText = ko.pureComputed(() => {
                const text = this.conceptSetIdsText().trim();
                if (!text) return [];
                return text.split(',')
                    .map(id => id.trim())
                    .filter(id => id && /^\d+$/.test(id))
                    .map(id => parseInt(id, 10));
            });

            // Computed to get final list of IDs
            this.conceptSetIdsForFilter = ko.pureComputed(() => {
                const textIds = this.conceptSetIdsFromText();
                if (textIds.length > 0) {
                    return textIds;
                }
                return this.selectedConceptSetIds();
            });

            // Validation
            this.conceptSetIdsValid = ko.pureComputed(() => {
                const text = this.conceptSetIdsText().trim();
                if (!text) return true;
                const ids = text.split(',').map(id => id.trim());
                return ids.every(id => /^\d+$/.test(id));
            });

            this.conceptSetIdsValidationMessage = ko.pureComputed(() => {
                if (!this.conceptSetIdsValid()) {
                    return ko.i18n('components.batchCompare.invalidConceptSetIds', 
                        'Invalid format. Please enter comma-separated numbers (e.g., 1,2,3)')();
                }
                return '';
            });

            // Local count of concept set IDs
            this.conceptSetIdsLocalCount = ko.pureComputed(() => {
                return this.conceptSetIdsForFilter().length;
            });

            this.conceptSetIdsCountMessage = ko.pureComputed(() => {
                const count = this.conceptSetIdsLocalCount();
                if (count === 0) return '';
                return ko.i18nformat('components.batchCompare.conceptSetIdsLocalCount',
                    '<%=count%> concept set ID(s) specified',
                    { count: count })();
            });

            // Clear selector selections when text is entered
            this.conceptSetIdsText.subscribe(newValue => {
                if (newValue && newValue.trim().length > 0) {
                    this.selectedConceptSetIds([]);
                    this.availableConceptSetsForFilter().forEach(cs => {
                        cs.selected(false);
                    });
                }
            });

            // Clear text when selector selections are made
            this.selectedConceptSetIds.subscribe(newValue => {
                if (newValue && newValue.length > 0) {
                    this.conceptSetIdsText('');
                }
            });

            this.createdDateOperator.subscribe(clearFilterCount);
            this.createdDateFrom.subscribe(clearFilterCount);
            this.createdDateTo.subscribe(clearFilterCount);
            this.updatedDateOperator.subscribe(clearFilterCount);
            this.updatedDateFrom.subscribe(clearFilterCount);
            this.updatedDateTo.subscribe(clearFilterCount);
            this.selectedAuthors.subscribe(clearFilterCount);
            this.selectedTags.subscribe(clearFilterCount);
            this.conceptSetIdsText.subscribe(clearFilterCount);
            this.selectedConceptSetIds.subscribe(clearFilterCount);
        }

        async loadAvailableTags() {
            if (this.isLoadingTags()) return;
            
            this.isLoadingTags(true);
            try {
                const res = await TagsService.loadAvailableTags();
                this.availableTags(res.filter(t => {
                    if (!t.groups || t.groups.length === 0) {
                        return false;
                    }
                    return true;
                }).map(tag => ({ selected: ko.observable(false), ...tag })));
            } catch (error) {
                console.error('Error loading tags:', error);
                this.availableTags([]);
            } finally {
                this.isLoadingTags(false);
            }
        }

        async loadAvailableAuthors() {
            if (this.isLoadingAuthors()) return;
            
            this.isLoadingAuthors(true);
            try {
                const users = await UserService.getUsers();
                const sortedUsers = users.sort((a, b) => {
                    const nameA = a.name || a.login;
                    const nameB = b.name || b.login;
                    return nameA.localeCompare(nameB);
                });
                this.availableAuthors(sortedUsers.map(user => ({ 
                    selected: ko.observable(false), 
                    ...user 
                })));
            } catch (error) {
                console.error('Error loading authors:', error);
                this.availableAuthors([]);
            } finally {
                this.isLoadingAuthors(false);
            }
        }

        // Load available concept sets for selector
        async loadAvailableConceptSetsForFilter() {
            if (this.availableConceptSetsForFilter().length > 0) return;
            
            this.isLoadingConceptSets(true);
            try {
                const response = await vocabularyService.getConceptSetList();
                const conceptSets = response.data || response;
                
                this.availableConceptSetsForFilter(
                    conceptSets
                        .filter(cs => cs.id && cs.name)
                        .map(cs => ({
                            selected: ko.observable(false),
                            id: cs.id,
                            name: cs.name
                        }))
                        .sort((a, b) => a.id - b.id)
                );
            } catch (error) {
                console.error('Error loading concept sets for filter:', error);
                this.availableConceptSetsForFilter([]);
                alert(ko.i18n('components.batchCompare.errorLoadingConceptSets', 
                    'Failed to load concept sets. Please try again.')());
            } finally {
                this.isLoadingConceptSets(false);
            }
        }

        // Toggle between modes
        toggleConceptSetIdFilterMode() {
            const newMode = this.conceptSetIdFilterMode() === 'text' ? 'selector' : 'text';
            this.conceptSetIdFilterMode(newMode);
            
            if (newMode === 'selector') {
                this.loadAvailableConceptSetsForFilter();
            }
        }

        // Open selector modal
        async openConceptSetSelectorModal() {
            // Don't open if text mode is active
            if (this.isTextModeActive()) {
                return;
            }
            
            await this.loadAvailableConceptSetsForFilter();
            
            // Sync selections with current state
            const currentIds = this.selectedConceptSetIds();
            this.availableConceptSetsForFilter().forEach(cs => {
                cs.selected(currentIds.includes(cs.id));
            });
            
            this.conceptSetsMessage('');
            this.showConceptSetSelectorModal(true);
        }

        applyConceptSetSelection() {
            const selected = this.availableConceptSetsForFilter()
                .filter(cs => cs.selected())
                .map(cs => cs.id);
            this.selectedConceptSetIds(selected);
            this.showConceptSetSelectorModal(false);
            this.conceptSetsMessage('');
        }

        removeSelectedConceptSet(conceptSetId) {
            this.selectedConceptSetIds.remove(conceptSetId);
            const available = this.availableConceptSetsForFilter().find(cs => cs.id === conceptSetId);
            if (available) {
                available.selected(false);
            }
        }

        async openTagsModal() {
            // Ensure tags are loaded
            if (this.availableTags().length === 0) {
                await this.loadAvailableTags();
            }
            
            ko.utils.arrayForEach(this.availableTags(), t => {
                t.selected(this.selectedTags().some(st => st.id === t.id));
            });
            this.tagsMessage('');
            this.showTagsModal(true);
        }

        applyTagsSelection() {
            this.selectedTags(this.availableTags().filter(t => t.selected()));
            this.showTagsModal(false);
            this.tagsMessage('');
        }

        removeTag(tag) {
            this.selectedTags.remove(t => t.id === tag.id);
            const availableTag = this.availableTags().find(t => t.id === tag.id);
            if (availableTag) {
                availableTag.selected(false);
            }
        }

        async openAuthorsModal() {
            // Ensure authors are loaded
            if (this.availableAuthors().length === 0) {
                await this.loadAvailableAuthors();
            }
            
            ko.utils.arrayForEach(this.availableAuthors(), a => {
                a.selected(this.selectedAuthors().some(sa => sa.id === a.id));
            });
            this.authorsMessage('');
            this.showAuthorsModal(true);
        }

        applyAuthorsSelection() {
            this.selectedAuthors(this.availableAuthors().filter(a => a.selected()));
            this.showAuthorsModal(false);
            this.authorsMessage('');
        }

        removeAuthor(author) {
            this.selectedAuthors.remove(a => a.id === author.id);
            const availableAuthor = this.availableAuthors().find(a => a.id === author.id);
            if (availableAuthor) {
                availableAuthor.selected(false);
            }
        }

        // Process dates based on operator
        getProcessedDates(operator, fromDate, toDate) {
            switch (operator) {
                case 'between':
                    return {
                        from: fromDate || null,
                        to: toDate || null
                    };
                case 'before':
                    return {
                        from: null,
                        to: toDate || null
                    };
                case 'after':
                    return {
                        from: fromDate || null,
                        to: null
                    };
                default:
                    return {
                        from: null,
                        to: null
                    };
            }
        }

        // Build request payload
        buildRequestPayload(includeVocabularies = true) {
            const createdDates = this.getProcessedDates(
                this.createdDateOperator(),
                this.createdDateFrom(),
                this.createdDateTo()
            );

            const updatedDates = this.getProcessedDates(
                this.updatedDateOperator(),
                this.updatedDateFrom(),
                this.updatedDateTo()
            );

            const payload = {
                createdDateFrom: createdDates.from,
                createdDateTo: createdDates.to,
                updatedDateFrom: updatedDates.from,
                updatedDateTo: updatedDates.to,
                authors: this.selectedAuthors().map(a => a.id),
                tags: this.selectedTags().map(t => t.id),
            };

            // Only include vocabulary-related fields if requested and available
            if (includeVocabularies) {
                payload.jobName = `Concept Set Batch Compare - ${new Date().toISOString()}`;
                payload.source1Key = this.selectedBaseVocabulary()?.sourceKey || null;
                payload.source2Key = this.selectedTargetVocabulary()?.sourceKey || null;
                payload.compareSourceCodes = this.compareSourceCodes();
            }

            const conceptSetIds = this.conceptSetIdsForFilter();
            if (conceptSetIds.length > 0) {
                payload.conceptSetIds = conceptSetIds;
            }

            return payload;
        }

        // Run batch compare
        runBatchCompare() {
            if (!this.canExecute() || this.isExecuting()) {
                return;
            }

            this.isExecuting(true);
            this.actionInProgress(ko.i18n('components.batchCompare.running', 'Running batch comparison...')());

            const requestPayload = this.buildRequestPayload();

            conceptSetService.runCohortCompareBatchJob(requestPayload)
                .then(() => {
                    console.log("Batch comparison job queued successfully");
                    this.isModalShown(false);
                    this.resetForm();
                    
                    alert(ko.i18n('components.batchCompare.success', 'Batch comparison job has been queued successfully')());
                })
                .catch(error => {
                    console.error(`Error running batch comparison: ${error}`);
                    alert(ko.i18n('components.batchCompare.error', 'Failed to queue batch comparison job')());
                })
                .finally(() => {
                    this.isExecuting(false);
                    this.actionInProgress('');
                });
        }

        // Cancel and close modal
        cancel() {
            this.isModalShown(false);
            this.resetForm();
        }

        // Reset form to initial state
        resetForm() {
            this.createdDateOperator('between');
            this.createdDateFrom('');
            this.createdDateTo('');
            
            this.updatedDateOperator('between');
            this.updatedDateFrom('');
            this.updatedDateTo('');
            
            this.selectedAuthors([]);
            this.selectedTags([]);
            this.compareSourceCodes(false);

            // Reset target vocabulary but keep base vocabulary
            this.selectedTargetVocabulary(null);

            // Reset tag selections
            ko.utils.arrayForEach(this.availableTags(), (tag) => tag.selected(false));
            
            // Reset author selections
            ko.utils.arrayForEach(this.availableAuthors(), (author) => author.selected(false));

            // Reset concept set IDs
            this.conceptSetIdsText('');
            this.selectedConceptSetIds([]);

            this.filterCount(null);
            this.filterCountMessage('');
            this.isCheckingCount(false);
        }

        checkFilterCount() {
            if (this.isCheckingCount()) {
                return;
            }
        
            this.isCheckingCount(true);
            this.filterCountMessage('');
            this.filterCount(null);
        
            const requestPayload = this.buildRequestPayload(false);
        
            conceptSetService.checkConceptSetFilterCount(requestPayload)
                .then(response => {
                    const count = response.data.count;
                    this.filterCount(count);
                    
                    const localCount = this.conceptSetIdsLocalCount();
                    let message = '';
                    
                    if (localCount > 0) {
                        // Show both counts
                        message = ko.i18nformat('components.batchCompare.conceptSetCountWithIds',
                            '<%=matchCount%> concept set(s) match the criteria (<%=idCount%> ID(s) specified)',
                            { matchCount: count, idCount: localCount })();
                    } else {
                        // Show only match count
                        if (count === 0) {
                            message = ko.i18n('components.batchCompare.noConceptSets', 
                                'No concept sets match the specified criteria')();
                        } else {
                            message = ko.i18nformat('components.batchCompare.conceptSetCount',
                                '<%=count%> concept set(s) match the specified criteria',
                                { count: count })();
                        }
                    }
                    
                    this.filterCountMessage(message);
                })
                .catch(error => {
                    console.error('Error checking filter count:', error);
                    this.filterCountMessage(
                        ko.i18n('components.batchCompare.errorCheckingCount',
                            'Error checking concept set count')()
                    );
                })
                .finally(() => {
                    this.isCheckingCount(false);
                });
        }
    }    
    return commonUtils.build('conceptset-batch-compare-modal', ConceptSetBatchCompareModal, view);
});