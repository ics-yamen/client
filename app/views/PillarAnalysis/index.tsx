import React, { useContext, useCallback, useMemo, useState } from 'react';
import {
    Prompt,
    useParams,
    useLocation,
} from 'react-router-dom';
import produce from 'immer';
import {
    useQuery,
    gql,
    useMutation,
} from '@apollo/client';
import {
    _cs,
    unique,
    doesObjectHaveNoData,
    isDefined,
    mapToList,
    isNotDefined,
    listToGroupList,
    randomString,
    listToMap,
    Obj,
} from '@togglecorp/fujs';
import {
    IoAdd,
    IoSwapVerticalOutline,
    IoCheckmark,
    IoClose,
    IoFunnel,
    IoChevronUp,
    IoChevronDown,
    IoChevronBackOutline,
    IoInformation,
} from 'react-icons/io5';
import {
    useBooleanState,
    PendingMessage,
    Heading,
    SelectInput,
    useAlert,
    Button,
    QuickActionButton,
    CollapsibleContainer,
    Tabs,
    Tab,
    TabList,
    TabPanel,
    Tooltip,
    ListView,
    Kraken,
    Pager,
} from '@the-deep/deep-ui';
import {
    useForm,
    useFormArray,
    EntriesAsList,
    removeNull,
    getErrorObject,
    internal,
    createSubmitHandler,
} from '@togglecorp/toggle-form';

import {
    breadcrumb,
    isFiltered,
    reorder,
} from '#utils/common';
import ProjectContext from '#base/context/ProjectContext';
import SubNavbar from '#components/SubNavbar';
import BackLink from '#components/BackLink';
import NonFieldError from '#components/NonFieldError';
import { transformSourcesFilterToEntriesFilter } from '#components/leadFilters/SourcesFilter/utils';
import SourcesAppliedFilters from '#components/leadFilters/SourcesAppliedFilters';
import { GeoArea } from '#components/GeoMultiSelectInput';
import { ProjectMember } from '#components/selections/ProjectMemberMultiSelectInput';
import { BasicOrganization } from '#components/selections/NewOrganizationMultiSelectInput';
import SortableList from '#components/SortableList';
import SourcesFilterContext from '#components/leadFilters/SourcesFilterContext';
import SourcesFilter, {
    useFilterState,
    getProjectSourcesQueryVariables,
} from '#components/leadFilters/SourcesFilter';
import { transformToFormError, ObjectError } from '#base/utils/errorTransform';
import { DeepReplace } from '#utils/types';
import { PartialFormType, FormType as FilterFormType } from '#components/leadFilters/SourcesFilter/schema';
import MarkdownEditor from '#components/MarkdownEditor';

import {
    PillarAnalysisDetailsQuery,
    PillarAnalysisDetailsQueryVariables,
    ProjectEntriesForAnalysisQuery,
    ProjectEntriesForAnalysisQueryVariables,
    PillarAnalysisUpdateMutation,
    AnalysisPillarUpdateInputType,
    PillarAnalysisUpdateMutationVariables,
    WidgetType as WidgetRaw,
    AttributeType as WidgetAttributeRaw,
} from '#generated/types';
import { ENTRY_FRAGMENT, FRAMEWORK_FRAGMENT } from '#gqlFragments';

import _ts from '#ts';

import { AnalysisPillars } from '#types';
import { WidgetAttribute as WidgetAttributeFromEntry } from '#types/newEntry';
import { FrameworkFilterType, Widget } from '#types/newAnalyticalFramework';

import DiscardedEntries from './DiscardedEntries';
import SourceEntryItem, { Props as SourceEntryItemProps } from './SourceEntryItem';
import AnalyticalStatementInput, {
    AnalyticalStatementInputProps,
} from './AnalyticalStatementInput';
import {
    schema,
    defaultFormValues,
    PartialAnalyticalStatementType,
} from './schema';

import EntryContext from './context';
import AutoClustering from './AutoClustering';

import styles from './styles.css';

const orderingOptions = [
    {
        key: 'lead__published_on',
        label: 'Lead published: Ascending',
    },
    {
        key: '-lead__published_on',
        label: 'Lead published: Descending',
    },
    {
        key: 'created_at',
        label: 'Entry created date: Ascending',
    },
    {
        key: '-created_at',
        label: 'Entry created date: Descending',
    },
    {
        key: 'lead__title',
        label: 'Source title: Ascending',
    },
    {
        key: '-lead__title',
        label: 'Source title: Descending',
    },
];

const orderingKeySelector = (item: { key: string }) => item.key;
const orderingLabelSelector = (item: { label: string }) => item.label;

interface BooleanOption {
    key: 'true' | 'false';
    value: string;
}

const hasEntryOptions: BooleanOption[] = [
    { key: 'true', value: 'Has entry' },
    { key: 'false', value: 'No entries' },
];

const hasAssessmentOptions: BooleanOption[] = [
    { key: 'true', value: 'Assessment completed' },
    { key: 'false', value: 'Assessment not completed' },
];

export const ENTRY_DETAILS = gql`
    ${ENTRY_FRAGMENT}
    fragment EntryDetails on EntryType {
        ...EntryResponse
        createdBy {
            id
            displayName
        }
        modifiedAt
        lead {
            id
            authors {
                id
                title
                shortName
                mergedAs {
                    id
                    title
                    shortName
                }
                organizationType {
                    id
                    shortName
                    title
                }
            }
            title
            url
            attachment {
                id
                title
                mimeType
                file {
                    url
                }
            }
            publishedOn
            source {
                id
                title
                shortName
                mergedAs {
                    id
                    title
                    shortName
                }
            }
            url
            shareViewUrl
        }
    }
`;

const PILLAR_ANALYSIS = gql`
    ${ENTRY_DETAILS}
    fragment PillarAnalysis on AnalysisPillarType {
        id
        title
        assignee {
            id
            displayName
        }
        mainStatement
        informationGap
        createdAt
        modifiedAt
        filters
        statements {
            id
            clientId
            order
            statement
            reportText
            informationGaps
            includeInReport
            title
            entries {
                id
                clientId
                entry {
                    ...EntryDetails
                }
                order
            }
        }
    }
`;

const PILLAR_ANALYSIS_UPDATE = gql`
    ${PILLAR_ANALYSIS}
    mutation PillarAnalysisUpdate(
        $id: ID!,
        $projectId: ID!,
        $data: AnalysisPillarUpdateInputType!,
    ) {
        project(id: $projectId) {
            analysisPillarUpdate(
                id: $id,
                data: $data,
            ) {
                ok
                errors
                result {
                    ...PillarAnalysis
                }
            }
        }
    }
`;

const PILLAR_ANALYSIS_DETAILS = gql`
    ${PILLAR_ANALYSIS}
    ${FRAMEWORK_FRAGMENT}
    query PillarAnalysisDetails(
        $projectId: ID!,
        $pillarId: ID!,
        $analysisId: ID!,
    ) {
        project(id: $projectId) {
            id
            analysis(id: $analysisId) {
                id
                title
            }
            analysisPillar(id: $pillarId) {
                ...PillarAnalysis
            }
            analysisFramework {
                id
                filters {
                    id
                    key
                    properties
                    title
                    widgetKey
                    widgetType
                    widgetTypeDisplay
                    filterType
                    filterTypeDisplay
                }
                ...FrameworkResponse
            }
        }
        sourceStatusOptions: __type(name: "LeadStatusEnum") {
            name
            enumValues {
                name
                description
            }
        }
        sourcePriorityOptions: __type(name: "LeadPriorityEnum") {
            name
            enumValues {
                name
                description
            }
        }
        sourceConfidentialityOptions: __type(name: "LeadConfidentialityEnum") {
            name
            enumValues {
                name
                description
            }
        }
        organizationTypes {
            results {
                id
                title
            }
        }
        entryTypeOptions: __type(name: "EntryTagTypeEnum") {
            name
            enumValues {
                name
                description
            }
        }
        staticColumnOptions: __type(name: "ExportExcelSelectedStaticColumnEnum") {
            name
            enumValues {
                name
                description
            }
        }
        discardedEntryTagOptions: __type(name: "DiscardedEntryTagTypeEnum") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

export type EntryType = NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<PillarAnalysisDetailsQuery['project']>['analysisPillar']>['statements']>[number]>['entries']>[number]>['entry'];
export type Entry = DeepReplace<EntryType, Omit<WidgetAttributeRaw, 'widgetTypeDisplay' | 'widthTypeDisplay'>, WidgetAttributeFromEntry>;

type FrameworkType = NonNullable<NonNullable<PillarAnalysisDetailsQuery['project']>['analysisFramework']>;
export type Framework = DeepReplace<FrameworkType, Omit<WidgetRaw, 'widgetIdDisplay' | 'widthDisplay'>, Widget>;

export type AnalyticalFrameworkType = NonNullable<NonNullable<PillarAnalysisDetailsQuery['project']>['analysisFramework']>;

export const PROJECT_ENTRIES_FOR_ANALYSIS = gql`
    ${ENTRY_DETAILS}
    query ProjectEntriesForAnalysis(
            $projectId: ID!
            $pillarId: ID!
            $page: Int,
            $pageSize: Int,
            $controlled: Boolean,
            $ordering: String,
            $createdAtGte: DateTime,
            $createdAtLte: DateTime,
            $createdBy: [ID!],
            $usedEntries: [ID!],
            $filterableData: [EntryFilterDataInputType!]
            $leadAssignees: [ID!],
            $leadCreatedBy: [ID!],
            $leadConfidentialities: [LeadConfidentialityEnum!],
            $leadPriorities: [LeadPriorityEnum!],
            $leadIsAssessment: Boolean,
            $leadHasAssessment: Boolean,
            $leadPublishedOnGte: Date,
            $leadPublishedOnLte: Date,
            $leadSourceOrganizations: [ID!],
            $leadAuthorOrganizations: [ID!],
            $leadStatuses: [LeadStatusEnum!],
            $leadAuthoringOrganizationTypes: [ID!],
        ) {
        project(id: $projectId) {
            id
            analysisPillar(id: $pillarId) {
                id
                discardedEntries {
                    totalCount
                }
                entries(
                    page: $page,
                    pageSize: $pageSize,
                    controlled: $controlled,
                    createdAtGte: $createdAtGte,
                    createdAtLte: $createdAtLte,
                    createdBy: $createdBy,
                    # NOTE: Filtering out all non-textual entries as they are not
                    # need for Analysis Module
                    entryTypes: EXCERPT,
                    filterableData: $filterableData,
                    leadAssignees: $leadAssignees,
                    leadConfidentialities: $leadConfidentialities,
                    leadPriorities: $leadPriorities,
                    leadCreatedBy: $leadCreatedBy,
                    leadPublishedOnGte: $leadPublishedOnGte,
                    leadPublishedOnLte: $leadPublishedOnLte,
                    leadStatuses: $leadStatuses,
                    leadIsAssessment: $leadIsAssessment,
                    leadHasAssessment: $leadHasAssessment,
                    leadAuthoringOrganizationTypes: $leadAuthoringOrganizationTypes,
                    leadSourceOrganizations: $leadSourceOrganizations,
                    leadAuthorOrganizations: $leadAuthorOrganizations,
                    ordering: $ordering,
                    excludeEntries: $usedEntries,
                ) {
                    totalCount
                    results {
                        ...EntryDetails
                    }
                }
            }
        }
    }
`;
export type DiscardedTags = NonNullable<NonNullable<PillarAnalysisDetailsQuery['discardedEntryTagOptions']>['enumValues']>[number];

// This is an aribtrary number
const STATEMENTS_LIMIT = 20;

type TabNames = 'entries' | 'discarded' | 'assigned';

const maxItemsPerPage = 25;

const entryKeySelector = (d: Entry) => d.id;

type FormType = typeof defaultFormValues;

const statementKeySelector = (d: PartialAnalyticalStatementType) => d.clientId ?? '';

function PillarAnalysis() {
    const {
        project,
    } = useContext(ProjectContext);

    const {
        projectId,
        pillarAnalysisId: pillarId,
        analysisId,
    } = useParams<{ projectId: string; pillarAnalysisId: string; analysisId: string }>();
    const alert = useAlert();
    // const initialValue = pillarAnalysisFromProps?.data ?? defaultFormValues;
    const initialValue = defaultFormValues;

    const {
        pristine,
        value,
        error: riskyError,
        setFieldValue,
        setValue,
        validate,
        setError,
    } = useForm(schema, initialValue);

    const error = getErrorObject(riskyError);
    const arrayError = getErrorObject(error?.statements);

    const {
        setValue: onAnalyticalStatementChange,
        removeValue: onAnalyticalStatementRemove,
    } = useFormArray('statements', setFieldValue);

    const [activeTab, setActiveTab] = useState<TabNames | undefined>('entries');

    // NOTE: data actually used to send to server
    const [
        sourcesFilters,
        setSourcesFilters,
    ] = useState<PartialFormType>({});

    const {
        value: sourcesFilterValue,
        setFieldValue: setSourcesFilterFieldValue,
        setValue: setSourcesFilterValue,
        resetValue: clearSourcesFilterValue,
        setError: setFilterError,
        validate: validateFilter,
        pristine: filterPristine,
        setPristine: setFilterPristine,
    } = useFilterState();

    // NOTE: retain entries mapping to show entry information in entry cards
    const [entriesMapping, setEntriesMapping] = useState<Obj<Entry>>({});

    const {
        loading: frameworkGetPending,
        data: projectDetailsResponse,
        refetch: getAnalysisDetails,
    } = useQuery<PillarAnalysisDetailsQuery, PillarAnalysisDetailsQueryVariables>(
        PILLAR_ANALYSIS_DETAILS,
        {
            variables: {
                projectId,
                pillarId,
                analysisId,
            },
            onCompleted: (response) => {
                const pillarData = removeNull(response?.project?.analysisPillar);
                if (!pillarData) {
                    return;
                }

                const newFilters = listToGroupList(
                    pillarData.filters as AnalysisPillars['filters'],
                    (o) => o.key,
                    (o) => o.id,
                );
                const filtersList = mapToList(
                    newFilters,
                    (d, k) => ({
                        filterKey: k,
                        valueList: d,
                    }),
                );
                setSourcesFilterValue({
                    entriesFilterData: {
                        filterableData: filtersList,
                    },
                });
                setSourcesFilters({
                    entriesFilterData: {
                        filterableData: filtersList,
                    },
                });
                const listOfEntries = pillarData.statements?.map(
                    (statement) => statement.entries?.map((entry) => entry.entry),
                ).flat().filter(isDefined) as Entry[] | undefined | null;
                setEntriesMapping((oldEntriesMappings) => ({
                    ...oldEntriesMappings,
                    ...listToMap(
                        listOfEntries ?? [],
                        (item) => item.id,
                        (item) => item,
                    ),
                }));

                // eslint-disable-next-line max-len
                let analyticalStatements: PartialAnalyticalStatementType[] = pillarData.statements?.map((statement) => ({
                    ...statement,
                    entries: statement.entries?.map((statementEntry) => ({
                        ...statementEntry,
                        entry: statementEntry.entry.id,
                    })),
                })) ?? [];

                if (
                    ((pillarData.statements?.length ?? 0) === 0)
                    && (pillarData.createdAt === pillarData.modifiedAt)
                ) {
                    // NOTE: We are adding 2 analytical statements if the pillar analysis
                    // is new and doesn't have any analytical statements
                    // by default (happens if its cloned)
                    const clientId1 = randomString();
                    const clientId2 = randomString();
                    const newAnalyticalStatement1: PartialAnalyticalStatementType = {
                        clientId: clientId1,
                        order: 1,
                        includeInReport: false,
                        statement: '',
                        reportText: '',
                        informationGaps: '',
                    };
                    const newAnalyticalStatement2: PartialAnalyticalStatementType = {
                        clientId: clientId2,
                        order: 2,
                        includeInReport: false,
                        statement: '',
                        reportText: '',
                        informationGaps: '',
                    };
                    analyticalStatements = [newAnalyticalStatement1, newAnalyticalStatement2];
                }

                /*
                const {
                    shouldSetValue,
                    isValueOverriden,
                } = checkVersion(versionId, pillarData.versionId);

                if (!shouldSetValue) {
                    return;
                }
                */

                // FIXME: check set pristine value
                // FIXME: only set after checking version id
                setValue((): FormType => ({
                    mainStatement: pillarData.mainStatement,
                    informationGap: pillarData.informationGap,
                    statements: analyticalStatements,
                }));

                // NOTE:
                // sometimes
                // 1. user could just open old document (the cache is set)
                // 2. user doesn't modify anything
                // 3. user returns later and finds there's new data on server
                // 4. we don't need to show notification in this case even if it's overridden
                /*
                if (isValueOverriden && !pristine) {
                    alert.show(
                        _ts('pillarAnalysis', 'dateOverridden'),
                        {
                            variant: 'info',
                        },
                    );
                }
                */
            },
        },
    );

    const discardedTags: DiscardedTags[] = useMemo(() => (
        projectDetailsResponse?.discardedEntryTagOptions?.enumValues ?? []
    ), [projectDetailsResponse?.discardedEntryTagOptions?.enumValues]);

    const analysisDetails = projectDetailsResponse?.project?.analysis;
    const analysisPillarDetails = projectDetailsResponse?.project?.analysisPillar;
    const frameworkDetails = projectDetailsResponse?.project?.analysisFramework as Framework;

    const [
        statementAndInfoGapsShown,
        , , ,
        toggleStatementAndInfoGaps,
    ] = useBooleanState(false);

    const [
        filtersShown,
        showFilter,
        , ,
        toggleShowFilter,
    ] = useBooleanState(false);

    const handleSourcesFiltersValueChange = useCallback(
        (...filterValue: EntriesAsList<PartialFormType>) => {
            // FIXME: let's use a different handler here
            if (!filtersShown) {
                showFilter();
            }
            setSourcesFilterFieldValue(...filterValue);
        },
        [setSourcesFilterFieldValue, showFilter, filtersShown],
    );

    const [activePage, setActivePage] = useState(1);

    const location = useLocation();
    const [
        createdByOptions,
        setCreatedByOptions,
    ] = useState<ProjectMember[] | undefined | null>();
    const [
        assigneeOptions,
        setAssigneeOptions,
    ] = useState<ProjectMember[] | undefined | null>();
    const [
        authorOrganizationOptions,
        setAuthorOrganizationOptions,
    ] = useState<BasicOrganization[] | undefined | null>();
    const [
        sourceOrganizationOptions,
        setSourceOrganizationOptions,
    ] = useState<BasicOrganization[] | undefined | null>();
    const [
        entryCreatedByOptions,
        setEntryCreatedByOptions,
    ] = useState<ProjectMember[] | undefined | null>();
    const [
        geoAreaOptions,
        setGeoAreaOptions,
    ] = useState<GeoArea[] | undefined | null>(undefined);

    const statusOptions = projectDetailsResponse
        ?.sourceStatusOptions?.enumValues;
    const priorityOptions = projectDetailsResponse
        ?.sourcePriorityOptions?.enumValues;
    const confidentialityOptions = projectDetailsResponse
        ?.sourceConfidentialityOptions?.enumValues;
    // FIXME: this may be problematic in the future
    const organizationTypeOptions = projectDetailsResponse
        ?.organizationTypes?.results;
    const entryTypeOptions = projectDetailsResponse
        ?.entryTypeOptions?.enumValues;
    const frameworkFilters = (projectDetailsResponse
        ?.project?.analysisFramework?.filters) as (FrameworkFilterType[] | null | undefined);

    const sourcesFilterContextValue = useMemo(() => ({
        createdByOptions,
        setCreatedByOptions,
        assigneeOptions,
        setAssigneeOptions,
        authorOrganizationOptions,
        setAuthorOrganizationOptions,
        sourceOrganizationOptions,
        setSourceOrganizationOptions,
        entryCreatedByOptions,
        setEntryCreatedByOptions,
        geoAreaOptions,
        setGeoAreaOptions,

        statusOptions,
        priorityOptions,
        confidentialityOptions,
        organizationTypeOptions,
        hasAssessmentOptions,
        hasEntryOptions,
        entryTypeOptions,
        frameworkFilters,
    }), [
        createdByOptions,
        assigneeOptions,
        authorOrganizationOptions,
        sourceOrganizationOptions,
        entryCreatedByOptions,
        geoAreaOptions,
        statusOptions,
        priorityOptions,
        confidentialityOptions,
        organizationTypeOptions,
        entryTypeOptions,
        frameworkFilters,
    ]);

    const entriesFilter = useMemo(
        () => {
            const transformedFilters = getProjectSourcesQueryVariables(
                sourcesFilters as Omit<FilterFormType, 'projectId'>,
            );
            return transformSourcesFilterToEntriesFilter(transformedFilters);
        },
        [sourcesFilters],
    );

    const usedEntries = useMemo(() => {
        const entries = value.statements
            ?.map((item) => item.entries)
            .flat()
            .map((item) => item?.entry)
            .flat()
            .filter(isDefined);

        return unique(entries ?? [], (item) => item);
    }, [value.statements]);

    const [entryOrdering, setEntryOrdering] = useState<string>('-created_at');

    /* Contextual data for NLP */
    const widgetTagLabels = useMemo(() => {
        const selectedFilters = listToMap(
            sourcesFilterValue?.entriesFilterData?.filterableData ?? [],
            (d) => d.filterKey,
            (d) => d.valueList,
        );

        const selectedFilterKeys = Object.keys(selectedFilters);

        const widgetTagMap = frameworkFilters
            ?.map((widget) => {
                if (
                    widget.widgetType === 'SELECT'
                    || widget.widgetType === 'MULTISELECT'
                    || widget.widgetType === 'ORGANIGRAM'
                    || widget.widgetType === 'MATRIX1D'
                    || widget.widgetType === 'MATRIX2D'
                ) {
                    return widget;
                }
                return undefined;
            }).filter(isDefined).filter(
                (ff) => selectedFilterKeys.includes(ff.key),
            )?.map((ff) => ({
                key: ff.key,
                options: ff.properties?.options,
            }));

        return widgetTagMap?.flatMap(
            (option) => option?.options?.filter(
                (widget) => selectedFilters?.[option.key]?.includes(widget.key),
            )?.map(
                (item: {key: string, label: string}) => item?.label,
            ),
        ).filter(isDefined);
    }, [
        frameworkFilters,
        sourcesFilterValue?.entriesFilterData?.filterableData,
    ]);

    const variables = useMemo(
        (): ProjectEntriesForAnalysisQueryVariables | undefined => (
            (projectId) ? {
                projectId,
                pillarId,
                page: activePage,
                pageSize: maxItemsPerPage,
                ordering: entryOrdering,
                usedEntries,
                ...entriesFilter,
            } : undefined
        ),
        [
            projectId,
            activePage,
            entriesFilter,
            entryOrdering,
            usedEntries,
            pillarId,
        ],
    );

    const {
        previousData,
        data: projectEntriesResponse = previousData,
        loading: pendingEntries,
        refetch: getEntries,
    } = useQuery<ProjectEntriesForAnalysisQuery, ProjectEntriesForAnalysisQueryVariables>(
        PROJECT_ENTRIES_FOR_ANALYSIS,
        {
            skip: isNotDefined(variables),
            variables,
        },
    );

    const [
        updateAnalysisPillars,
        {
            loading: pendingPillarAnalysisSave,
        },
    ] = useMutation<PillarAnalysisUpdateMutation, PillarAnalysisUpdateMutationVariables>(
        PILLAR_ANALYSIS_UPDATE,
        {
            onCompleted: (response) => {
                const pillarResponse = response?.project?.analysisPillarUpdate;
                if (!pillarResponse) {
                    return;
                }

                const {
                    ok,
                    errors,
                } = pillarResponse;

                if (ok) {
                    const analyticalStatements: PartialAnalyticalStatementType[] = pillarResponse
                        .result?.statements?.map((statement) => ({
                            ...statement,
                            title: statement.title ?? undefined,
                            entries: statement.entries?.map((statementEntry) => ({
                                ...statementEntry,
                                entry: statementEntry.entry.id,
                            })),
                        })) ?? [];
                    setValue((): FormType => ({
                        mainStatement: pillarResponse?.result?.mainStatement,
                        informationGap: pillarResponse?.result?.informationGap,
                        statements: analyticalStatements,
                    }));
                    alert.show(
                        _ts('pillarAnalysis', 'pillarAnalysisUpdateSuccess'),
                        {
                            variant: 'success',
                        },
                    );
                } else if (!ok) {
                    const formError = transformToFormError(removeNull(errors) as ObjectError[]);
                    if (formError?.project) {
                        setError({
                            ...formError,
                            [internal]: formError?.project as string,
                        });
                    } else {
                        setError(formError);
                    }
                    alert.show(
                        'There was an error while saving analysis. Make sure there are no issues.',
                        {
                            variant: 'error',
                        },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Error during update.',
                    {
                        variant: 'error',
                    },
                );
            },
        },
    );

    const entriesResponse = useMemo(() => (
        removeNull(projectEntriesResponse?.project?.analysisPillar?.entries) as {
            totalCount: number | null | undefined;
            results: Entry[] | null | undefined;
        }
    ), [projectEntriesResponse]);

    const discardedEntriesCount = projectEntriesResponse
        ?.project?.analysisPillar?.discardedEntries?.totalCount;

    const handleEntryDrop = useCallback(
        (entryId: string) => {
            const entry = entriesResponse?.results?.find((item) => item.id === entryId);
            if (!entry) {
                // eslint-disable-next-line no-console
                console.error('Me no understand how this entry came from', entryId);
                return;
            }
            setEntriesMapping((oldEntriesMapping) => ({
                ...oldEntriesMapping,
                [entryId]: entry,
            }));
        },
        [entriesResponse?.results],
    );

    const handleAnalyticalStatementAdd = useCallback(
        () => {
            // NOTE: Don't let users add more that certain items
            if ((value.statements?.length ?? 0) >= STATEMENTS_LIMIT) {
                return;
            }

            const oldStatements = value.statements ?? [];

            const clientId = randomString();
            const newAnalyticalStatement: PartialAnalyticalStatementType = {
                clientId,
                order: oldStatements.length + 1,
                includeInReport: false,
                statement: '',
                reportText: '',
                informationGaps: '',
            };
            setFieldValue(
                [...oldStatements, newAnalyticalStatement],
                'statements' as const,
            );
        },
        [setFieldValue, value.statements],
    );

    type AnalyticalStatements = typeof value.statements;

    const handleEntryMove = useCallback(
        (entryId: string, statementClientId: string) => {
            setFieldValue(
                (oldStatements: AnalyticalStatements) => (
                    produce(oldStatements ?? [], (safeStatements) => {
                        const selectedIndex = safeStatements
                            .findIndex((s) => s.clientId === statementClientId);
                        if (selectedIndex !== -1) {
                            const safeEntries = safeStatements[selectedIndex].entries;
                            const entryIndex = safeEntries?.findIndex((s) => s.entry === entryId);

                            if (isDefined(entryIndex) && entryIndex !== -1) {
                                safeEntries?.splice(entryIndex, 1);
                            }
                        }
                    })
                ),
                'statements' as const,
            );
        },
        [setFieldValue],
    );

    const handleFilterApply = useCallback(() => {
        const submit = createSubmitHandler(
            validateFilter,
            setFilterError,
            () => {
                setSourcesFilters(sourcesFilterValue);
                setFilterPristine(true);
            },
        );
        submit();
    }, [
        sourcesFilterValue,
        validateFilter,
        setFilterError,
        setSourcesFilters,
        setFilterPristine,
    ]);

    const handleFilterClear = useCallback(() => {
        clearSourcesFilterValue();
        setSourcesFilters({});
        setFilterPristine(true);
    }, [
        clearSourcesFilterValue,
        setFilterPristine,
    ]);

    const handleSubmit = useCallback(
        () => {
            const submit = createSubmitHandler(
                validate,
                (errorFromForm) => {
                    if (errorFromForm) {
                        alert.show(
                            'Looks like there are some issues with the data you have entered. Make sure there are no errors.',
                            {
                                variant: 'error',
                            },
                        );
                        setError(errorFromForm);
                    }
                },
                (finalVal) => {
                    updateAnalysisPillars({
                        variables: {
                            id: pillarId,
                            projectId,
                            data: { ...finalVal } as AnalysisPillarUpdateInputType,
                        },
                    });
                },
            );
            submit();
        },
        [
            pillarId,
            alert,
            projectId,
            setError,
            validate,
            updateAnalysisPillars,
        ],
    );

    const assignedEntryCardRendererParams = useCallback(
        (key: string): SourceEntryItemProps => ({
            entryId: key,
            entry: entriesMapping[key],
            excerpt: entriesMapping[key]?.excerpt,
            image: entriesMapping[key]?.image,
            createdAt: entriesMapping[key]?.createdAt,
            // tabularFieldData: data.tabularFieldData,
            entryType: entriesMapping[key]?.entryType,
            // authoringOrganization: data.lead.authors[0].shortName,
            pillarId,
            pillarModifiedDate: projectDetailsResponse?.project?.analysisPillar?.modifiedAt,
            discardedTags,
            onEntryDiscard: getEntries,
            projectId,
            framework: frameworkDetails,
            geoAreaOptions,
            setGeoAreaOptions,
            onEntryDataChange: getAnalysisDetails,
            entryAttachment: entriesMapping[key]?.entryAttachment,
        }), [
            pillarId,
            projectId,
            getEntries,
            discardedTags,
            projectDetailsResponse?.project?.analysisPillar?.modifiedAt,
            frameworkDetails,
            geoAreaOptions,
            setGeoAreaOptions,
            getAnalysisDetails,
            entriesMapping,
        ],
    );

    const entryCardRendererParams = useCallback(
        (key: string, data: Entry): SourceEntryItemProps => ({
            entryId: key,
            entry: data,
            excerpt: data.excerpt,
            image: data.image,
            createdAt: data.createdAt,
            // tabularFieldData: data.tabularFieldData,
            entryType: data.entryType,
            // authoringOrganization: data.lead.authors[0].shortName,
            pillarId,
            pillarModifiedDate: projectDetailsResponse?.project?.analysisPillar?.modifiedAt,
            discardedTags,
            onEntryDiscard: getEntries,
            projectId,
            framework: frameworkDetails,
            geoAreaOptions,
            setGeoAreaOptions,
            onEntryDataChange: getAnalysisDetails,
            entryAttachment: data.entryAttachment,
        }), [
            pillarId,
            projectId,
            getEntries,
            discardedTags,
            projectDetailsResponse?.project?.analysisPillar?.modifiedAt,
            frameworkDetails,
            geoAreaOptions,
            setGeoAreaOptions,
            getAnalysisDetails,
        ],
    );

    const pending = frameworkGetPending
        || pendingPillarAnalysisSave;

    const handleNgramChange = useCallback((val: string | undefined) => {
        setSourcesFilterValue((filterVal) => ({
            ...filterVal,
            search: val,
        }));
    }, [setSourcesFilterValue]);

    const analyticalStatementRendererParams = useCallback((
        _: string,
        statement: PartialAnalyticalStatementType,
        index: number,
    ): AnalyticalStatementInputProps => ({
        className: styles.analyticalStatement,
        index,
        value: statement,
        framework: frameworkDetails,
        onChange: onAnalyticalStatementChange,
        onRemove: onAnalyticalStatementRemove,
        geoAreaOptions,
        setGeoAreaOptions,
        onEntryMove: handleEntryMove,
        onEntryDrop: handleEntryDrop,
        onSelectedNgramChange: handleNgramChange,
        error: statement?.clientId ? arrayError?.[statement?.clientId] : undefined,
        onEntryDataChange: getAnalysisDetails,
        widgetTagLabels,
    }), [
        handleNgramChange,
        onAnalyticalStatementChange,
        onAnalyticalStatementRemove,
        getAnalysisDetails,
        handleEntryMove,
        handleEntryDrop,
        frameworkDetails,
        geoAreaOptions,
        arrayError,
        widgetTagLabels,
    ]);

    const onOrderChange = useCallback((
        newValues: PartialAnalyticalStatementType[],
    ) => {
        const orderedValues = reorder(newValues);
        setFieldValue(orderedValues, 'statements');
    }, [setFieldValue]);

    const statementsCount = value.statements?.length ?? 0;

    const entryContextValue = useMemo(
        () => ({
            entries: entriesMapping,
            setEntries: setEntriesMapping,
        }),
        [entriesMapping, setEntriesMapping],
    );

    const handleStatementsFromClustersSet = useCallback(
        (newStatements: PartialAnalyticalStatementType[]) => {
            setFieldValue(newStatements, 'statements');
        },
        [setFieldValue],
    );

    const isCurrentFilterEmpty = doesObjectHaveNoData(sourcesFilters, ['', null]);
    const isFilterEmpty = doesObjectHaveNoData(sourcesFilterValue, ['', null]);

    return (
        <div className={styles.pillarAnalysis}>
            <SubNavbar
                className={styles.header}
                heading={project?.title}
                childrenClassName={styles.breadcrumb}
                homeLinkShown
                defaultActions={(
                    <>
                        <Button
                            name={undefined}
                            onClick={toggleStatementAndInfoGaps}
                            className={styles.statementAndInfoGapsButton}
                            variant="action"
                            actions={(
                                statementAndInfoGapsShown
                                    ? <IoChevronUp /> : <IoChevronDown />
                            )}
                        >
                            Statement and Info Gaps
                        </Button>
                        <BackLink
                            defaultLink="/"
                        >
                            {_ts('pillarAnalysis', 'closeButtonLabel')}
                        </BackLink>
                        <Button
                            name={undefined}
                            variant="primary"
                            disabled={
                                pristine || pending
                            }
                            onClick={handleSubmit}
                        >
                            {_ts('pillarAnalysis', 'saveButtonLabel')}
                        </Button>
                    </>
                )}
            >
                {breadcrumb([
                    analysisDetails?.title,
                    analysisPillarDetails?.title ?? '',
                ])}
            </SubNavbar>
            <SourcesFilterContext.Provider value={sourcesFilterContextValue}>
                <div className={styles.content}>
                    {(frameworkGetPending || pending) && <PendingMessage />}
                    <NonFieldError error={error} />
                    {statementAndInfoGapsShown && (
                        <div className={styles.inputsContainer}>
                            <div className={styles.inputContainer}>
                                <MarkdownEditor
                                    className={styles.editor}
                                    label={(
                                        <Heading
                                            className={styles.inputHeader}
                                            size="extraSmall"
                                        >
                                            {_ts('pillarAnalysis', 'mainStatementLabel')}
                                        </Heading>
                                    )}
                                    name="mainStatement"
                                    onChange={setFieldValue}
                                    value={value.mainStatement}
                                    error={error?.mainStatement}
                                    height={150}
                                    disabled={pending}
                                />
                            </div>
                            <div className={styles.inputContainer}>
                                <MarkdownEditor
                                    className={styles.editor}
                                    label={(
                                        <Heading
                                            className={styles.inputHeader}
                                            size="extraSmall"
                                        >
                                            {_ts('pillarAnalysis', 'infoGapLabel')}
                                        </Heading>
                                    )}
                                    name="informationGap"
                                    value={value.informationGap}
                                    onChange={setFieldValue}
                                    error={error?.informationGap}
                                    height={150}
                                    disabled={pending}
                                />
                            </div>
                        </div>
                    )}
                    <div className={styles.filterContainer}>
                        <Button
                            name={undefined}
                            onClick={toggleShowFilter}
                            spacing="compact"
                            icons={<IoFunnel />}
                        >
                            Filter
                        </Button>
                        {!(isCurrentFilterEmpty && isFilterEmpty) && (
                            <div className={styles.buttons}>
                                <Button
                                    disabled={filterPristine}
                                    name="sourcesFilterSubmit"
                                    spacing="compact"
                                    icons={(
                                        <IoCheckmark />
                                    )}
                                    variant="tertiary"
                                    onClick={handleFilterApply}
                                >
                                    Apply
                                </Button>
                                <Button
                                    disabled={isFilterEmpty}
                                    name="clearFilter"
                                    icons={(
                                        <IoClose />
                                    )}
                                    variant="tertiary"
                                    spacing="compact"
                                    onClick={handleFilterClear}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                        <SourcesAppliedFilters
                            className={styles.appliedFilters}
                            value={sourcesFilterValue}
                            onChange={handleSourcesFiltersValueChange}
                        />
                    </div>
                    <div className={styles.workspace}>
                        {filtersShown && (
                            <SourcesFilter
                                className={styles.entriesFilter}
                                value={sourcesFilterValue}
                                projectId={projectId}
                                onChange={handleSourcesFiltersValueChange}
                                isEntriesOnlyFilter
                                optionsLoading={false}
                                optionsErrored={false}
                                // NOTE: This is to prevent users from choosing
                                // entry type (eg: EXCERPT, IMAGE, etc) from
                                // filters as only EXCERPT entry types are
                                // displayed here
                                hideEntryTypeFilter
                            />
                        )}
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            variant="secondary"
                        >
                            <CollapsibleContainer
                                className={styles.entryListSection}
                                expandButtonClassName={styles.expandEntryListButton}
                                collapseButtonClassName={styles.collapseEntryListButton}
                                expandButtonContent={(
                                    <div className={styles.buttonText}>
                                        Show Entries
                                        <IoChevronBackOutline />
                                    </div>
                                )}
                                headerClassName={styles.entryListHeader}
                                headingClassName={styles.tabListHeading}
                                headingSize="small"
                                contentClassName={styles.content}
                                headerDescription={activeTab === 'entries' && (
                                    <div className={styles.headerDescription}>
                                        <SelectInput
                                            icons={(
                                                <IoSwapVerticalOutline />
                                            )}
                                            name={undefined}
                                            value={entryOrdering}
                                            onChange={setEntryOrdering}
                                            keySelector={orderingKeySelector}
                                            options={orderingOptions}
                                            labelSelector={orderingLabelSelector}
                                            variant="general"
                                            nonClearable
                                        />
                                        <AutoClustering
                                            pillarId={pillarId}
                                            projectId={projectId}
                                            entriesFilter={entriesFilter}
                                            isPrivateProject={project?.isPrivate}
                                            onEntriesMappingChange={setEntriesMapping}
                                            entriesCount={entriesResponse?.totalCount}
                                            onStatementsFromClustersSet={
                                                handleStatementsFromClustersSet
                                            }
                                            widgetTagLabels={widgetTagLabels}
                                        />
                                        {project?.isPrivate && (
                                            <div className={styles.info}>
                                                <IoInformation />
                                                <Tooltip>
                                                    Auto clustering is not available
                                                    for private projects to
                                                    maintain document privacy.
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                )}
                                heading={(
                                    <TabList className={styles.tabList}>
                                        <Tab
                                            name="entries"
                                            className={styles.tab}
                                        >
                                            {`All (${entriesResponse?.totalCount ?? 0})`}
                                        </Tab>
                                        <Tab
                                            name="assigned"
                                            className={styles.tab}
                                        >
                                            {`Assigned (${usedEntries?.length ?? 0})`}
                                        </Tab>
                                        <Tab
                                            name="discarded"
                                            className={styles.tab}
                                        >
                                            {`Discarded (${discardedEntriesCount ?? 0})`}
                                        </Tab>
                                    </TabList>
                                )}
                                spacing="compact"
                            >
                                <TabPanel
                                    name="entries"
                                    activeClassName={styles.tabPanel}
                                >
                                    <ListView
                                        className={styles.entriesList}
                                        data={entriesResponse?.results}
                                        keySelector={entryKeySelector}
                                        renderer={SourceEntryItem}
                                        rendererParams={entryCardRendererParams}
                                        pending={pendingEntries}
                                        errored={false}
                                        filtered={isFiltered(sourcesFilterValue)}
                                        emptyIcon={(
                                            <Kraken
                                                variant="experiment"
                                            />
                                        )}
                                        emptyMessage="Entries not found."
                                        filteredEmptyMessage="No matching entries were found."
                                        messageIconShown
                                        messageShown
                                    />
                                    <Pager
                                        className={styles.pager}
                                        activePage={activePage}
                                        itemsCount={entriesResponse?.totalCount ?? 0}
                                        maxItemsPerPage={maxItemsPerPage}
                                        onActivePageChange={setActivePage}
                                        itemsPerPageControlHidden
                                    />
                                </TabPanel>
                                <TabPanel
                                    name="assigned"
                                    activeClassName={styles.tabPanel}
                                >
                                    <ListView
                                        className={styles.entriesList}
                                        data={usedEntries}
                                        keySelector={(item) => item}
                                        renderer={SourceEntryItem}
                                        rendererParams={assignedEntryCardRendererParams}
                                        pending={pendingEntries}
                                        errored={false}
                                        filtered={isFiltered(sourcesFilterValue)}
                                        emptyIcon={(
                                            <Kraken
                                                variant="experiment"
                                            />
                                        )}
                                        emptyMessage="Entries not found."
                                        filteredEmptyMessage="No matching entries were found."
                                        messageIconShown
                                        messageShown
                                    />
                                </TabPanel>
                                <TabPanel
                                    name="discarded"
                                    activeClassName={styles.tabPanel}
                                >
                                    <DiscardedEntries
                                        className={styles.discardedEntriesContainer}
                                        pillarId={pillarId}
                                        discardedTags={discardedTags}
                                        onUndiscardSuccess={getEntries}
                                        projectId={projectId}
                                    />
                                </TabPanel>
                            </CollapsibleContainer>
                        </Tabs>
                        <EntryContext.Provider
                            value={entryContextValue}
                        >
                            <div className={styles.rightContainer}>
                                <SortableList
                                    className={_cs(
                                        styles.list,
                                        statementsCount < 1 && styles.empty,
                                    )}
                                    name="analyticalStatements"
                                    onChange={onOrderChange}
                                    data={value.statements}
                                    keySelector={statementKeySelector}
                                    renderer={AnalyticalStatementInput}
                                    direction="horizontal"
                                    rendererParams={analyticalStatementRendererParams}
                                    messageShown
                                    messageIconShown
                                    emptyMessage="Looks like there aren't any analytical statements in this analysis."
                                    messageActions={(
                                        <Button
                                            className={styles.addStatementButton}
                                            name={undefined}
                                            onClick={handleAnalyticalStatementAdd}
                                            title={_ts('pillarAnalysis', 'addAnalyticalStatementButtonTitle')}
                                            variant="primary"
                                            icons={(<IoAdd />)}
                                        >
                                            Add Analytical Statement
                                        </Button>
                                    )}
                                />
                                {statementsCount > 0 && (
                                    <QuickActionButton
                                        className={styles.addStatementButton}
                                        name={undefined}
                                        onClick={handleAnalyticalStatementAdd}
                                        title={(statementsCount < STATEMENTS_LIMIT
                                            ? _ts('pillarAnalysis', 'addAnalyticalStatementButtonTitle')
                                            : `You cannot add more than ${STATEMENTS_LIMIT} statements.`
                                        )}
                                        variant="primary"
                                        disabled={statementsCount >= STATEMENTS_LIMIT}
                                    >
                                        <IoAdd />
                                    </QuickActionButton>
                                )}
                            </div>
                            <Prompt
                                message={(newLocation) => {
                                    if (newLocation.pathname !== location.pathname && !pristine) {
                                        return _ts('common', 'youHaveUnsavedChanges');
                                    }
                                    return true;
                                }}
                            />
                        </EntryContext.Provider>
                    </div>
                </div>
            </SourcesFilterContext.Provider>
        </div>
    );
}

export default PillarAnalysis;
