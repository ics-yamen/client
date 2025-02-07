import React, { ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import {
    _cs,
    listToMap,
    unique,
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import {
    Checkbox,
    CheckboxProps,
    Container,
    Kraken,
    Pager,
    TableView,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    Tag,
    TagProps,
    createStringColumn,
    useAlert,
    useBooleanState,
    useRowExpansion,
    RowExpansionContext,
} from '@the-deep/deep-ui';
import {
    useMutation,
    useQuery,
    gql,
} from '@apollo/client';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import { VscLoading } from 'react-icons/vsc';
import {
    ProjectSourcesQuery,
    ProjectSourcesQueryVariables,
    DeleteLeadMutation,
    DeleteLeadMutationVariables,
    LeadOrderingEnum,
    BulkDeleteLeadsMutation,
    BulkDeleteLeadsMutationVariables,
} from '#generated/types';
import _ts from '#ts';
import { createDateColumn } from '#components/tableHelpers';
import { useModalState } from '#hooks/stateManagement';
import { organizationTitleSelector } from '#components/selections/NewOrganizationSelectInput';
import OrganizationLink, { Props as OrganizationLinkProps } from '#components/OrganizationLink';
import LeadPreviewButton, { Props as LeadPreviewProps } from '#components/lead/LeadPreviewButton';
import ProgressLine, { Props as ProgressLineProps } from '#components/ProgressLine';
import {
    calcPercent,
    isFiltered,
} from '#utils/common';
import LeadEditModal from '#components/general/LeadEditModal';
import { getProjectSourcesQueryVariables } from '#components/leadFilters/SourcesFilter';
import {
    PartialFormType as PartialFilterFormType,
    FormType as FilterFormType,
} from '#components/leadFilters/SourcesFilter/schema';
import { transformSourcesFilterToEntriesFilter } from '#components/leadFilters/SourcesFilter/utils';

import { Lead } from './types';
import Actions, { Props as ActionsProps } from './Actions';
import BulkActions from './BulkActions';
import EntryList from './EntryList';
import LeadDuplicatesModal from './LeadDuplicatesModal';

import { PROJECT_SOURCES, DELETE_LEAD } from '../queries';
import styles from './styles.css';

// FIXME: use another util
function sourcesKeySelector(d: Lead) {
    return d.id;
}

// FIXME: use another util
export function organizationUrlSelector(
    org: {
        url?: string;
        mergedAs?: { url?: string | null } | null;
    },
) {
    if (org.mergedAs) {
        return org.mergedAs.url ?? undefined;
    }
    return org.url;
}

const statusIconMap: { [key in Lead['status']]: ReactNode } = {
    NOT_TAGGED: null,
    IN_PROGRESS: <VscLoading />,
    TAGGED: <IoCheckmarkCircleOutline />,
};

const statusVariantMap: Record<Lead['status'], 'default' | 'gradient1' | 'complement1'> = {
    NOT_TAGGED: 'default',
    IN_PROGRESS: 'gradient1',
    TAGGED: 'complement1',
};

const BULK_DELETE_LEADS = gql`
    mutation BulkDeleteLeads(
        $projectId: ID!,
        $leadIdsToDelete: [ID!],
    ){
        project(id: $projectId) {
            leadBulk(deleteIds: $leadIdsToDelete) {
                errors
                result {
                    id
                    title
                }
            }
        }
    }
`;
const defaultMaxItemsPerPage = 10;

interface Props {
    className?: string;
    projectId: string;
    filters: PartialFilterFormType;
    ordering: string;
    onSourcesGetSuccess: () => void;
}

function SourcesTable(props: Props) {
    const {
        className,
        projectId,
        filters: rawFilters,
        ordering,
        onSourcesGetSuccess,
    } = props;

    const alert = useAlert();

    const filters = useMemo(() => (
        getProjectSourcesQueryVariables(
            rawFilters as Omit<FilterFormType, 'projectId'>,
        )
    ), [rawFilters]);

    const entriesFilter = useMemo(
        () => transformSourcesFilterToEntriesFilter(filters),
        [filters],
    );

    const [activePage, setActivePage] = useState(1);
    const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
    const [maxItemsPerPage, setMaxItemsPerPage] = useState(defaultMaxItemsPerPage);

    const [leadToEdit, setLeadToEdit] = useState<string | undefined>();
    const [leadIdToViewDuplicates, setLeadIdToViewDuplicates] = useState<string | undefined>();

    const [
        isDuplicatesModalVisible,
        showDuplicatesModal,
        hideDuplicatesModal,
    ] = useModalState(false);

    const [
        showSingleSourceModal,
        setShowSingleSourceModalTrue,
        setShowSingleSourceModalFalse,
    ] = useBooleanState(false);

    useEffect(() => {
        setActivePage(1);
    }, [filters]);

    const variables = useMemo(
        (): ProjectSourcesQueryVariables | undefined => {
            if (!projectId) {
                return undefined;
            }
            return ({
                ...filters,
                projectId,
                page: activePage,
                pageSize: maxItemsPerPage,
                ordering: [ordering as LeadOrderingEnum],
            });
        },
        [projectId, activePage, ordering, filters, maxItemsPerPage],
    );

    const {
        previousData,
        data: projectSourcesResponse = previousData,
        loading: projectSourcesPending,
        refetch: getProjectSources,
    } = useQuery<ProjectSourcesQuery, ProjectSourcesQueryVariables>(
        PROJECT_SOURCES,
        {
            skip: isNotDefined(variables),
            variables,
            onCompleted: () => {
                onSourcesGetSuccess();
            },
        },
    );

    const [
        deleteLead,
        { loading: leadDeletePending },
    ] = useMutation<DeleteLeadMutation, DeleteLeadMutationVariables>(
        DELETE_LEAD,
        {
            onCompleted: (response) => {
                if (response?.project?.leadDelete?.ok) {
                    alert.show(
                        'Successfully deleted source.',
                        {
                            variant: 'success',
                        },
                    );
                    getProjectSources();
                } else {
                    alert.show(
                        'Failed to delete source.',
                        {
                            variant: 'error',
                        },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to delete source.',
                    {
                        variant: 'error',
                    },
                );
            },
        },
    );

    const sourcesResponse = projectSourcesResponse?.project?.leads;
    const sources = sourcesResponse?.results;

    const [
        bulkDeleteLeads,
        { loading: bulkDeletePending },
    ] = useMutation<BulkDeleteLeadsMutation, BulkDeleteLeadsMutationVariables>(
        BULK_DELETE_LEADS,
        {
            onCompleted: (response) => {
                if (isDefined(response.project?.leadBulk?.result)) {
                    alert.show(
                        'Successfully deleted sources!',
                        { variant: 'success' },
                    );
                    setSelectedLeads([]);
                    getProjectSources();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to delete leads',
                    { variant: 'error' },
                );
            },

        },
    );

    const handleBulkDeleteLeads = useCallback((selectedLeadIds: string[]) => {
        bulkDeleteLeads({
            variables: {
                projectId,
                leadIdsToDelete: selectedLeadIds,
            },
        });
    }, [
        bulkDeleteLeads,
        projectId,
    ]);

    const clearSelection = useCallback(() => {
        setSelectedLeads([]);
    }, []);

    const handleSelectAll = useCallback((value: boolean) => {
        setSelectedLeads((oldLeads) => {
            if (value) {
                return unique([...oldLeads, ...sources ?? []], (d) => d.id);
            }
            const idMap = listToMap(sources ?? [], (d) => d.id, () => true);
            return oldLeads.filter((d) => !idMap[d.id]);
        });
    }, [sources]);

    const handleSelection = useCallback((value: boolean, lead: Lead) => {
        if (value) {
            setSelectedLeads((oldSelectedLeads) => ([...oldSelectedLeads, lead]));
        } else {
            setSelectedLeads((oldSelectedLeads) => (
                oldSelectedLeads.filter((v) => v.id !== lead.id)
            ));
        }
    }, []);

    const [
        rowModifier,
        expandedRowKey,
        setExpandedRowKey,
    ] = useRowExpansion<Lead, string>(
        ({ datum }) => {
            const showEntries = isDefined(datum.filteredEntriesCount)
                ? (datum.filteredEntriesCount > 0)
                : (datum.entriesCount?.total ?? 0) > 0;
            if (showEntries) {
                return (
                    <EntryList
                        key={datum.id}
                        leadId={datum.id}
                        projectId={datum.project}
                        filters={entriesFilter}
                        getProjectSources={getProjectSources}
                    />
                );
            }
            return null;
        },
        {
            expandedRowClassName: styles.expandedRow,
            expandedCellClassName: styles.expandedCell,
            expansionCellClassName: styles.expansionCell,
            expansionRowClassName: styles.expansionRow,
        },
    );

    const handleDelete = useCallback(
        (leadId: string) => {
            deleteLead({
                variables: {
                    projectId,
                    leadId,
                },
            });
        },
        [projectId, deleteLead],
    );

    const handleEdit = useCallback((leadId: string) => {
        setLeadToEdit(leadId);
        setShowSingleSourceModalTrue();
    }, [setShowSingleSourceModalTrue]);

    const handleShowDuplicates = useCallback((leadId: string) => {
        setLeadIdToViewDuplicates(leadId);
        showDuplicatesModal();
    }, [showDuplicatesModal]);

    const handleSourceSaveSuccess = useCallback(() => {
        setShowSingleSourceModalFalse();
    }, [setShowSingleSourceModalFalse]);

    const handleModalClose = useCallback(() => {
        getProjectSources();
        hideDuplicatesModal();
    }, [getProjectSources, hideDuplicatesModal]);

    const pending = projectSourcesPending || bulkDeletePending || leadDeletePending;

    const expandedContextValue = useMemo(
        () => ({ expandedRowKey, setExpandedRowKey }),
        [expandedRowKey, setExpandedRowKey],
    );

    const columns = useMemo(() => {
        const selectedLeadsMap = listToMap(selectedLeads, (d) => d.id, () => true);
        const selectAllCheckValue = sources?.some((d) => selectedLeadsMap[d.id]);

        const selectColumn: TableColumn<
            Lead, string, CheckboxProps<string>, CheckboxProps<string>
        > = {
            id: 'select',
            title: '',
            headerCellRenderer: Checkbox,
            headerCellRendererParams: {
                value: selectAllCheckValue,
                // label: selectedLeads.length > 0
                // ? _ts('sourcesTable', 'selectedNumberOfSources',
                // { noOfSources: selectedLeads.length }) : _ts('sourcesTable', 'selectAll'),
                onChange: handleSelectAll,
                indeterminate: !(selectedLeads.length === sources?.length
                    || selectedLeads.length === 0),
            },
            cellRenderer: Checkbox,
            cellRendererParams: (_, data) => ({
                name: data.id,
                value: selectedLeads.some((v) => v.id === data.id),
                onChange: (newVal) => handleSelection(newVal, data),
            }),
            columnWidth: 48,
        };
        const statusColumn: TableColumn<
            Lead, string, TagProps, TableHeaderCellProps
        > = {
            id: 'status',
            title: _ts('sourcesTable', 'status'),
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: {
                sortable: false,
            },
            cellRendererClassName: styles.status,
            cellRenderer: Tag,
            cellRendererParams: (_, data) => ({
                actions: statusIconMap[data.status],
                variant: statusVariantMap[data.status],
                children: data.statusDisplay,
            }),
            columnWidth: 190,
        };
        const leadTitleColumn: TableColumn<
            Lead, string, LeadPreviewProps, TableHeaderCellProps
        > = {
            id: 'TITLE',
            title: _ts('sourcesTable', 'titleLabel'),
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: {
                sortable: true,
            },
            cellRenderer: LeadPreviewButton,
            cellRendererParams: (_, data) => ({
                title: data.title,
                label: data.title,
                url: data.url,
                attachment: data.attachment,
                className: styles.title,
            }),
            columnClassName: styles.titleColumn,
            columnWidth: 160,
        };
        const publisherColumn: TableColumn<
            Lead, string, OrganizationLinkProps, TableHeaderCellProps
        > = {
            id: 'SOURCE',
            title: _ts('sourcesTable', 'publisher'),
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: {
                sortable: true,
            },
            cellRenderer: OrganizationLink,
            cellRendererParams: (_, data) => ({
                title: data.source ? organizationTitleSelector(data.source) : undefined,
                link: data.source ? organizationUrlSelector(data.source) : undefined,
            }),
            columnWidth: 160,
        };
        const percentControlledColumn: TableColumn<
            Lead, string, ProgressLineProps, TableHeaderCellProps
        > = {
            id: 'percentControlled',
            title: '% Controlled',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: {
                sortable: false,
            },
            cellRenderer: ProgressLine,
            cellRendererParams: (_, data) => ({
                progress: calcPercent(
                    data.entriesCount?.controlled,
                    data.entriesCount?.total,
                ) ?? 0,
                size: 'small',
                hideInfoCircleBackground: true,
            }),
        };
        const actionsColumn: TableColumn<
            Lead, string, ActionsProps<string>, TableHeaderCellProps
        > = {
            id: 'actions',
            title: '',
            headerCellRenderer: TableHeaderCell,
            headerCellRendererParams: {
                sortable: false,
            },
            cellRenderer: Actions,
            cellRendererParams: (_, data) => ({
                id: data.id,
                title: data.title,
                onEditClick: handleEdit,
                onDeleteClick: handleDelete,
                onShowDuplicatesClick: handleShowDuplicates,
                entriesCount: data.entriesCount?.total ?? 0,
                filteredEntriesCount: data.filteredEntriesCount,
                hasAssessment: !!data.assessmentId,
                assessmentId: data.assessmentId ?? undefined,
                isAssessmentLead: data.isAssessmentLead,
                sourceStatus: data.status,
                duplicateLeadsCount: data.duplicateLeadsCount,
                projectId,
            }),
            columnWidth: 200,
        };
        return ([
            selectColumn,
            statusColumn,
            createDateColumn<Lead, string>(
                'CREATED_AT',
                _ts('sourcesTable', 'createdAt'),
                (item) => item.createdAt,
                {
                    sortable: true,
                    columnWidth: 144,
                },
            ),
            leadTitleColumn,
            createStringColumn<Lead, string>(
                'PAGE_COUNT',
                _ts('sourcesTable', 'pages'),
                (item) => {
                    if (!item.leadPreview?.pageCount) {
                        return '-';
                    }
                    return `${item.leadPreview.pageCount} ${item.leadPreview.pageCount > 1 ? 'pages' : 'page'}`;
                },
                {
                    sortable: true,
                    columnWidth: 96,
                },
            ),
            publisherColumn,
            createStringColumn<Lead, string>(
                'authors',
                _ts('sourcesTable', 'authors'),
                (item) => item.authors?.map(organizationTitleSelector).join(', '),
                {
                    sortable: false,
                    columnWidth: 144,
                },
            ),
            createDateColumn<Lead, string>(
                'PUBLISHED_ON',
                'Date Published',
                (item) => item.publishedOn ?? '',
                {
                    sortable: true,
                    columnWidth: 144,
                },
            ),
            createStringColumn<Lead, string>(
                'CREATED_BY',
                _ts('sourcesTable', 'addedBy'),
                (item) => item.createdBy?.displayName,
                {
                    sortable: true,
                    columnWidth: 144,
                },
            ),
            createStringColumn<Lead, string>(
                'ASSIGNEE',
                _ts('sourcesTable', 'assignee'),
                (item) => item.assignee?.displayName,
                {
                    sortable: true,
                    columnWidth: 144,
                },
            ),
            createStringColumn<Lead, string>(
                'PRIORITY',
                _ts('sourcesTable', 'priority'),
                (item) => item.priorityDisplay,
                {
                    sortable: true,
                    columnWidth: 96,
                },
            ),
            percentControlledColumn,
            actionsColumn,
        ]);
    }, [
        handleSelectAll,
        handleSelection,
        sources,
        selectedLeads,
        handleEdit,
        handleDelete,
        projectId,
        handleShowDuplicates,
    ]);

    return (
        <>
            <Container
                className={_cs(styles.sourcesTableContainer, className)}
                contentClassName={styles.content}
                footerActions={(
                    <Pager
                        activePage={activePage}
                        itemsCount={sourcesResponse?.totalCount ?? 0}
                        maxItemsPerPage={maxItemsPerPage}
                        onItemsPerPageChange={setMaxItemsPerPage}
                        onActivePageChange={setActivePage}
                    />
                )}
            >
                <RowExpansionContext.Provider
                    value={expandedContextValue}
                >
                    <TableView
                        className={styles.table}
                        data={sources}
                        keySelector={sourcesKeySelector}
                        rowClassName={styles.tableRow}
                        columns={columns}
                        rowModifier={rowModifier}
                        variant="large"
                        pending={pending}
                        overflowContainerClassName={styles.overflowContainer}
                        filtered={isFiltered(entriesFilter)}
                        errored={false}
                        filteredEmptyMessage="No matching sources found."
                        filteredEmptyIcon={(
                            <Kraken
                                size="large"
                                variant="search"
                            />
                        )}
                        emptyMessage="No sources found."
                        emptyIcon={(
                            <Kraken
                                size="large"
                                variant="sleep"
                            />
                        )}
                        messageShown
                        messageIconShown
                    />
                </RowExpansionContext.Provider>
                {showSingleSourceModal && (
                    <LeadEditModal
                        leadId={String(leadToEdit)}
                        projectId={String(projectId)}
                        onClose={setShowSingleSourceModalFalse}
                        onLeadSaveSuccess={handleSourceSaveSuccess}
                    />
                )}
                {isDuplicatesModalVisible && leadIdToViewDuplicates && (
                    <LeadDuplicatesModal
                        onClose={handleModalClose}
                        leadId={leadIdToViewDuplicates}
                        projectId={projectId}
                    />
                )}
            </Container>
            {(selectedLeads.length > 0 && !bulkDeletePending) && (
                <BulkActions
                    selectedLeads={selectedLeads}
                    activeProject={projectId}
                    onRemoveClick={handleBulkDeleteLeads}
                    onClearSelection={clearSelection}
                />
            )}
        </>
    );
}

export default SourcesTable;
