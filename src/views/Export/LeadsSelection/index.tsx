import React, { useCallback, useState, useMemo } from 'react';

import {
    compareString,
    compareNumber,
    compareDate,
    _cs,
} from '@togglecorp/fujs';

import AccentButton from '#rsca/Button/AccentButton';
import FormattedDate from '#rscv/FormattedDate';
import RawTable from '#rscv/RawTable';
import Pager from '#rscv/Pager';
import TableHeader from '#rscv/TableHeader';
import { getCombinedLeadFilters } from '#entities/lead';
import useRequest from '#utils/request';

import _ts from '#ts';
import {
    FilterFields,
    Lead,
    MultiResponse,
    WidgetElement,
    GeoOptions,
} from '#typings';
import { notifyOnFailure } from '#utils/requestNotify';
import { Header } from '#rscv/Table';

import FilterForm from './FilterForm';
import styles from './styles.scss';

interface ComponentProps {
    pending?: boolean;
    projectId: number;
    filterOnlyUnprotected: boolean;
    className?: string;
    entriesFilters?: FilterFields[];
    entriesWidgets?: WidgetElement<unknown>[];
    projectRegions?: unknown[];
    entriesGeoOptions?: GeoOptions;
    hasAssessment?: boolean;
    onSelectLeadChange: (v: number, value: boolean) => void;
    selectedLeads: number[];
    selectAll: boolean;
    onSelectAllChange: () => void;
}

const leadKeyExtractor = (d: Lead) => d.id;
const maxItemsPerPage = 10;

export interface FaramValues {
    [key: string]: string | string[] | FaramValues;
}

function LeadsSelection(props: ComponentProps) {
    const {
        projectId,
        className,
        filterOnlyUnprotected,
        entriesFilters,
        entriesWidgets,
        projectRegions,
        entriesGeoOptions,
        hasAssessment,
        selectedLeads,
        onSelectLeadChange,
        selectAll,
        onSelectAllChange,
    } = props;

    const [activeSort, setActiveSort] = useState<string>('-created_at');
    const [activePage, setActivePage] = useState<number>(1);
    const [filterValues, onFilterChange] = useState<FaramValues>({});

    const sanitizedFilters = useMemo(() => {
        interface ProcessedFilters {
            'entries_filter': ([string] | string)[];
            [key: string]: [string] | string | ([string] | string)[];
        }
        const processedFilters: ProcessedFilters = getCombinedLeadFilters(
            filterValues,
            entriesWidgets,
            entriesGeoOptions,
        );
        // Unprotected filter is sent to request to fetch leads
        // if user cannot create export for confidential documents
        if (hasAssessment) {
            processedFilters.exists = 'assessment_exists';
        }
        if (filterOnlyUnprotected) {
            processedFilters.confidentiality = ['unprotected'];
        }

        return processedFilters;
    }, [
        filterOnlyUnprotected,
        filterValues,
        hasAssessment,
        entriesGeoOptions,
        entriesWidgets,
    ]);

    const leadsRequestBody = useMemo(() => ({
        custom_filters: 'exclude_empty_filtered_entries',
        project: [projectId],
        ...sanitizedFilters,
    }), [projectId, sanitizedFilters]);

    const [
        pending,
        leadsResponse,
    ] = useRequest<MultiResponse<Lead>>({
        url: 'server://v2/leads/filter/',
        method: 'POST',
        query: {
            fields: [
                'id',
                'title',
                'created_at',
                'published_on',
                'entries_count',
                'filtered_entries_count',
                'source_detail',
                'authors_detail',
            ],
            project: projectId,
            ordering: activeSort,
            is_preview: false,
            offset: (activePage - 1) * maxItemsPerPage,
            limit: maxItemsPerPage,
        },
        autoTrigger: true,
        body: leadsRequestBody,
        onFailure: (_, errorBody) => {
            notifyOnFailure(_ts('export', 'leadsLabel'))({ error: errorBody });
        },
    });

    const isDisabled = leadsResponse?.results.length === 0;

    const headers: Header<Lead>[] = useMemo(() => ([
        {
            key: 'select',
            label: '',
            order: 1,
            sortable: false,
            modifier: (d: Lead) => {
                const key = leadKeyExtractor(d);
                const isSelected = selectedLeads.some(v => v === key);

                let title: string;
                let icon: string;
                if (selectAll) {
                    title = !isSelected
                        ? _ts('export.leadsTable', 'unselectLeadTitle')
                        : _ts('export.leadsTable', 'selectLeadTitle');
                    icon = !isSelected
                        ? 'checkbox'
                        : 'checkboxOutlineBlank';
                } else {
                    title = isSelected
                        ? _ts('export.leadsTable', 'unselectLeadTitle')
                        : _ts('export.leadsTable', 'selectLeadTitle');

                    icon = isSelected
                        ? 'checkbox'
                        : 'checkboxOutlineBlank';
                }

                return (
                    <AccentButton
                        title={title}
                        iconName={icon}
                        onClick={() => onSelectLeadChange(key, !isSelected)}
                        smallVerticalPadding
                        transparent
                    />
                );
            },
        },
        {
            key: 'createdAt',
            label: _ts('export', 'createdAtLabel'),
            order: 2,
            sortable: true,
            comparator: (a: Lead, b: Lead) => (
                compareDate(a.createdAt, b.createdAt) ||
                compareString(a.title, b.title)
            ),
            modifier: (row: Lead) => (
                <FormattedDate
                    value={row.createdAt}
                    mode="dd-MM-yyyy hh:mm"
                />
            ),
        },
        {
            key: 'title',
            label: _ts('export', 'titleLabel'),
            order: 3,
            sortable: true,
            comparator: (a: Lead, b: Lead) => compareString(a.title, b.title),
        },
        {
            key: 'sourceDetail',
            label: _ts('export', 'sourceDetailLabel'),
            order: 4,
            sortable: true,
            modifier: (a: Lead) => a?.sourceDetail?.title,
            comparator: (a: Lead, b: Lead) =>
                compareString(a?.sourceDetail?.title, b?.sourceDetail?.title) ||
                compareString(a.title, b.title),
        },
        {
            key: 'authorsDetail',
            label: _ts('export', 'authoursDetailLabel'),
            order: 5,
            sortable: false,
            modifier: (d: Lead) => d?.authorsDetail.map(a => a.title).join(', '),
        },
        {
            key: 'publishedOn',
            label: _ts('export', 'publishedOnLabel'),
            order: 6,
            sortable: true,
            comparator: (a: Lead, b: Lead) => (
                compareDate(a.publishedOn, b.publishedOn) ||
                compareString(a.title, b.title)
            ),
        },
        {
            key: 'filteredEntriesCount',
            label: _ts('export', 'entriesCountLabel'),
            order: 7,
            sortable: true,
            comparator: (a: Lead, b: Lead) => (
                compareNumber(a.entriesCount, b.entriesCount) ||
                compareString(a.title, b.title)
            ),
        },
    ]), [
        onSelectLeadChange,
        selectedLeads,
        selectAll,
    ]);

    const dataModifier = useCallback(
        (data, columnKey) => {
            const header = headers.find(d => d.key === columnKey);
            if (header?.modifier) {
                return header.modifier(data);
            }
            return data[columnKey];
        }, [headers],
    );

    const headerModifier = useCallback((headerData) => {
        let sortOrder: 'asc' | 'dsc' | undefined;
        if (activeSort === headerData.key) {
            sortOrder = 'asc';
        } else if (activeSort === `-${headerData.key}`) {
            sortOrder = 'dsc';
        }
        if (headerData.key === 'select') {
            const title = !selectAll
                ? _ts('export.leadsTable', 'unselectAllLeadsTitle')
                : _ts('export.leadsTable', 'selectAllLeadsTitle');

            const icon = selectAll
                ? 'checkbox'
                : 'checkboxOutlineBlank';

            return (
                <AccentButton
                    className={styles.selectAllCheckbox}
                    title={title}
                    iconName={icon}
                    onClick={onSelectAllChange}
                    smallVerticalPadding
                    transparent
                    disabled={isDisabled}
                />
            );
        }
        return (
            <TableHeader
                label={headerData.label}
                sortOrder={sortOrder}
                sortable={headerData.sortable}
            />
        );
    }, [activeSort, onSelectAllChange, isDisabled, selectAll]);

    const handleTableHeaderClick = useCallback(
        (key) => {
            const headerData = headers.find(h => h.key === key);
            // prevent click on 'actions' column
            if (!headerData || !headerData.sortable) {
                return;
            }

            let tmpActiveSort = activeSort;

            const isAsc = tmpActiveSort?.charAt(0) !== '-';

            const isCurrentHeaderSorted = tmpActiveSort === key
                || (tmpActiveSort?.substr(1) === key && !isAsc);

            if (isCurrentHeaderSorted) {
                tmpActiveSort = isAsc ? `-${key}` : key;
            } else {
                tmpActiveSort = headerData.defaultSortOrder === 'dsc' ? `-${key}` : key;
            }

            setActiveSort(tmpActiveSort);
        }, [headers, activeSort, setActiveSort],
    );

    return (
        <div className={_cs(className, styles.leadsTable)}>
            <FilterForm
                projectId={projectId}
                filterOnlyUnprotected={filterOnlyUnprotected}
                filterValues={filterValues}
                entriesFilters={entriesFilters}
                entriesWidgets={entriesWidgets}
                geoOptions={entriesGeoOptions}
                regions={projectRegions}
                onChange={onFilterChange}
                hasAssessment={hasAssessment}
            />
            <RawTable
                data={leadsResponse?.results || []}
                dataModifier={dataModifier}
                headerModifier={headerModifier}
                headers={headers}
                onHeaderClick={handleTableHeaderClick}
                keySelector={leadKeyExtractor}
                className={styles.table}
                pending={pending && (leadsResponse?.results || []).length < 1}
            />
            <Pager
                activePage={activePage}
                className={styles.pager}
                itemsCount={leadsResponse?.count}
                maxItemsPerPage={maxItemsPerPage}
                onPageClick={setActivePage}
                showItemsPerPageChange={false}
            />
        </div>
    );
}

export default LeadsSelection;
