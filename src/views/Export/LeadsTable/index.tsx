import React, { useCallback, useState, useMemo } from 'react';
import {
    compareString,
    compareDate,
    _cs,
} from '@togglecorp/fujs';

import AccentButton from '#rsca/Button/AccentButton';
import FormattedDate from '#rscv/FormattedDate';
import RawTable from '#rscv/RawTable';
import Pager from '#rscv/Pager';
import TableHeader from '#rscv/TableHeader';
import { getFiltersForRequest } from '#entities/lead';
import useRequest from '#utils/request';

import _ts from '#ts';
import {
    Lead,
    MultiResponse,
} from '#typings';
import { notifyOnFailure } from '#utils/requestNotify';

import FilterForm from '../ExportSelection/FilterForm';
import { SelectedLead } from '../index';
import styles from './styles.scss';

interface ComponentProps {
    onSelectLeadChange: (key: number, selected: boolean) => void;
    onSelectAllClick: (v: boolean) => void;
    pending?: boolean;
    projectId: number;
    filterOnlyUnprotected: boolean;
    className?: string;
}

const leadKeyExtractor = (d: SelectedLead) => d.id;
const maxItemsPerPage = 25;

function ExportLeadsTable(props: ComponentProps) {
    const {
        filterValues,
        onFilterChange,
        projectId,
        className,
        onSelectAllClick,
        onSelectLeadChange,
        filterOnlyUnprotected,
    } = props;

    const [leads, setLeads] = useState<SelectedLead[]>([]);
    const [leadsCount, setLeadsCount] = useState<number>(0);
    const [activeSort, setActiveSort] = useState<string>('-created_at');
    const [activePage, setActivePage] = useState<number>(1);

    const sanitizedFilters = useMemo(() => {
        const processedFilters = getFiltersForRequest(filterValues);
        // Unprotected filter is sent to request to fetch leads
        // if user cannot create export for confidential documents
        if (filterOnlyUnprotected) {
            processedFilters.confidentiality = ['unprotected'];
        }
        return processedFilters;
    }, [filterOnlyUnprotected, filterValues]);

    const leadsRequestBody = useMemo(() => ({
        project: [projectId],
        ...sanitizedFilters,
    }), [projectId, sanitizedFilters]);

    const [
        pending,
    ] = useRequest<MultiResponse<Lead>>({
        url: 'server://v2/leads/filter/',
        method: 'POST',
        query: {
            fields: ['id', 'title', 'created_at'],
            project: projectId,
            ordering: activeSort,
            is_preview: false,
            offset: (activePage - 1) * maxItemsPerPage,
            limit: maxItemsPerPage,
        },
        autoTrigger: true,
        body: leadsRequestBody,
        onSuccess: (response) => {
            const newLeads: SelectedLead[] = [];
            (response.results || []).forEach((l) => {
                newLeads.push({
                    selected: true,
                    ...l,
                });
            });
            setLeadsCount(response.count);
            setLeads(newLeads);
        },
        onFailure: (error, errorBody) => {
            notifyOnFailure(_ts('export', 'leadsLabel'))({ error: errorBody });
        },
    });

    const areSomeNotSelected = leads.some(l => !l.selected);
    const isDisabled = leads.length === 0;

    const headers = useMemo(() => ([
        {
            key: 'select',
            labelModifier: () => {
                const title = areSomeNotSelected
                    ? _ts('export.leadsTable', 'selectAllLeadsTitle')
                    : _ts('export.leadsTable', 'unselectAllLeadsTitle');

                const icon = areSomeNotSelected
                    ? 'checkboxOutlineBlank'
                    : 'checkbox';

                return (
                    <AccentButton
                        className={styles.selectAllCheckbox}
                        title={title}
                        iconName={icon}
                        onClick={() => onSelectAllClick(areSomeNotSelected)}
                        smallVerticalPadding
                        transparent
                        disabled={isDisabled}
                    />
                );
            },
            order: 1,
            sortable: false,
            modifier: (d: SelectedLead) => {
                const key = leadKeyExtractor(d);

                const title = !d.selected
                    ? _ts('export.leadsTable', 'selectLeadTitle')
                    : _ts('export.leadsTable', 'unselectLeadTitle');

                const icon = !d.selected
                    ? 'checkboxOutlineBlank'
                    : 'checkbox';

                return (
                    <AccentButton
                        title={title}
                        iconName={icon}
                        onClick={() => onSelectLeadChange(key, !d.selected)}
                        smallVerticalPadding
                        transparent
                    />
                );
            },
        },
        {
            key: 'title',
            label: _ts('export', 'titleLabel'),
            order: 2,
            sortable: true,
            comparator: (a: SelectedLead, b: SelectedLead) => compareString(a.title, b.title),
        },
        {
            key: 'createdAt',
            label: _ts('export', 'createdAtLabel'),
            order: 3,
            sortable: true,
            comparator: (a: SelectedLead, b: SelectedLead) => (
                compareDate(a.createdAt, b.createdAt) ||
                compareString(a.title, b.title)
            ),
            modifier: (row: SelectedLead) => (
                <FormattedDate
                    value={row.createdAt}
                    mode="dd-MM-yyyy hh:mm"
                />
            ),
        },
    ]), [
        onSelectLeadChange,
        onSelectAllClick,
        areSomeNotSelected,
        isDisabled,
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
        let sortOrder = '';
        if (activeSort === headerData.key) {
            sortOrder = 'asc';
        } else if (activeSort === `-${headerData.key}`) {
            sortOrder = 'dsc';
        }
        return (
            <TableHeader
                label={headerData.label}
                sortOrder={sortOrder}
                sortable={headerData.sortable}
            />
        );
    }, [activeSort]);

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
                tmpActiveSort = headerData?.defaultSortOrder === 'dsc' ? `-${key}` : key;
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
                onChange={onFilterChange}
            />
            <RawTable
                data={leads}
                dataModifier={dataModifier}
                headerModifier={headerModifier}
                headers={headers}
                onHeaderClick={handleTableHeaderClick}
                keySelector={leadKeyExtractor}
                className={styles.table}
                pending={pending && leads.length < 1}
            />
            <Pager
                activePage={activePage}
                className={styles.pager}
                itemsCount={leadsCount}
                maxItemsPerPage={maxItemsPerPage}
                onPageClick={setActivePage}
                showItemsPerPageChange={false}
            />
        </div>
    );
}

export default ExportLeadsTable;
