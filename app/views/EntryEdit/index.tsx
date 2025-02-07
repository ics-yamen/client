import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    useParams,
    useLocation,
    Prompt,
} from 'react-router-dom';
import {
    isNotDefined,
    _cs,
    unique,
    listToMap,
    randomString,
    isDefined,
    mapToMap,
    compareDate,
    isObject,
} from '@togglecorp/fujs';
import {
    PendingMessage,
    ConfirmButton,
    Button,
    Tabs,
    Tab,
    TabList,
    TabPanel,
    VirtualizedListView,
    Kraken,
    Container,
    useAlert,
    Message,
} from '@the-deep/deep-ui';
import {
    useForm,
    useFormArray,
    useFormObject,
    SetValueArg,
    isCallable,
    createSubmitHandler,
    getErrorObject,
    analyzeErrors,
    removeNull,
} from '@togglecorp/toggle-form';
import { useMutation, useQuery } from '@apollo/client';

import { getHiddenWidgetIds } from '#types/newAnalyticalFramework';
import { GeoArea } from '#components/GeoMultiSelectInput';
import { transformToFormError, ObjectError } from '#base/utils/errorTransform';
import ProjectContext from '#base/context/ProjectContext';
import UserContext from '#base/context/UserContext';
import SubNavbarContext from '#components/SubNavbar/context';
import SubNavbar, { SubNavbarIcons } from '#components/SubNavbar';
import TestTag from '#components/TestTag';
import BackLink from '#components/BackLink';
import ExcerptInput from '#components/entry/ExcerptInput';
import EntryControl from '#components/entryReview/EntryControl';
import EntryVerification from '#components/entryReview/EntryVerification';
import {
    schema as leadSchema,
    PartialFormType as PartialLeadFormType,
} from '#components/lead/LeadInput/schema';
import {
    ProjectFrameworkQuery,
    ProjectFrameworkQueryVariables,
    LeadEntriesQuery,
    LeadEntriesQueryVariables,
    LeadInputType,
    BulkUpdateEntriesMutation,
    BulkUpdateEntriesMutationVariables,
    LeadUpdateMutation,
    LeadUpdateMutationVariables,
    LeadPreviewForTextQuery,
    LeadPreviewAttachmentType,
} from '#generated/types';
import { BasicOrganization } from '#components/selections/NewOrganizationSelectInput';
import { BasicProjectUser } from '#components/selections/ProjectUserSelectInput';
// import { BasicLeadGroup } from '#components/selections/LeadGroupSelectInput';
import EntryInput from '#components/entry/EntryInput';
import Section from '#components/entry/Section';
import FrameworkImageButton from '#components/framework/FrameworkImageButton';
import {
    CountMap,
    CommentCountContext,
    CommentCountContextInterface,
} from '#components/entryReview/EntryCommentWrapper/CommentContext';
import _ts from '#ts';
import usePromptOnCloseAndRefresh from '#hooks/usePromptOnCloseAndRefresh';

import EntryCommentWrapper from '#components/entryReview/EntryCommentWrapper';
import getSchema, { defaultFormValues, PartialEntryType, PartialFormType } from '#components/entry/schema';
import { Entry, EntryInput as EntryInputType, Framework } from '#components/entry/types';
import LeftPaneEntries, { TabOptions } from '#components/LeftPaneEntries';
import { createDefaultAttributes } from '#components/LeftPaneEntries/utils';
import {
    PROJECT_FRAMEWORK,
    BULK_UPDATE_ENTRIES,
    UPDATE_LEAD,
    LEAD_ENTRIES,
} from './queries';

import SourceDetails from './SourceDetails';

import styles from './styles.css';

interface VirtualizedEntryListComponent {
    scrollTo: (item: string) => void;
}

export type EntryImagesMap = { [key: string]: Entry['image'] | undefined };
export type EntryAttachmentsMap = { [key: string]: Entry['entryAttachment'] | undefined };

const DELETE_LEN = 100;
const UPDATE_LEN = 100;

const entryKeySelector = (e: PartialEntryType) => e.clientId;
export type Lead = NonNullable<NonNullable<LeadEntriesQuery['project']>['lead']>;

type LeadAttachment = NonNullable<NonNullable<NonNullable<LeadPreviewForTextQuery['project']>['leadPreviewAttachments']>['results']>[number];
export type LeadAttachmentsMap = { [key: string]: LeadAttachment | undefined };

function transformEntry(entry: Entry): EntryInputType {
    // FIXME: make this re-usable
    return removeNull({
        ...entry,
        lead: entry.lead.id,
        image: entry.image?.id,
        entryAttachment: undefined,
        // NOTE: We need the leadAttachment value here to map with the preview
        // on Tables and Visuals page
        leadAttachment: entry.entryAttachment?.leadAttachmentId,
        attributes: entry.attributes?.map((attribute) => ({
            ...attribute,
            // NOTE: we don't need this on form
            geoSelectedOptions: undefined,
        })),
    });
}

interface Props {
    className?: string;
}

function EntryEdit(props: Props) {
    const { className } = props;
    const { project } = React.useContext(ProjectContext);
    const { user } = React.useContext(UserContext);
    const { leadId } = useParams<{ leadId: string }>();

    const [
        commentsCountMap,
        setCommentsCountMap,
    ] = useState<CountMap>({});
    const [
        verifiedIdsMap,
        setVerifiedIdsMap,
    ] = useState<{ [key in string]: string[] | undefined } | undefined>();
    const [
        controlledMap,
        setControlledMap,
    ] = useState<{ [key in string]: boolean } | undefined>();

    const location = useLocation();
    const locationState = location?.state as {
        entryId?: string;
        entryServerId?: string;
        sectionId?: string;
        activePage?: 'primary' | 'secondary' | 'review' | undefined;
    } | undefined;

    const entryIdFromLocation = locationState?.entryId;
    const entryServerIdFromLocation = locationState?.entryServerId;
    const sectionIdFromLocation = locationState?.sectionId;
    const activePageFromLocation = locationState?.activePage;

    const commentCountContext: CommentCountContextInterface = useMemo(() => ({
        commentsCountMap,
        setCommentsCountMap,
    }), [commentsCountMap]);

    const projectId = project ? project.id : undefined;

    const [iconsNode, setIconsNode] = useState<Element | null | undefined>();

    const navbarContextValue = useMemo(
        () => ({
            iconsNode,
            setIconsNode,
        }),
        [iconsNode],
    );

    const [
        geoAreaOptions,
        setGeoAreaOptions,
    ] = useState<GeoArea[] | undefined | null>(undefined);

    const alert = useAlert();

    // LEAD
    const leadInitialValue: PartialLeadFormType = useMemo(() => ({
        clientId: randomString(),
        sourceType: 'WEBSITE',
        priority: 'LOW',
        confidentiality: 'UNPROTECTED',
        isAssessmentLead: false,
        assignee: user?.id,
    }), [user]);

    const [
        projectUserOptions,
        setProjectUserOptions,
    ] = useState<BasicProjectUser[] | undefined | null>();

    const [
        sourceOrganizationOptions,
        setSourceOrganizationOptions,
    ] = useState<BasicOrganization[] | undefined | null>();

    const [
        authorOrganizationOptions,
        setAuthorOrganizationOptions,
    ] = useState<BasicOrganization[] | undefined | null>();

    /*
    const [
        leadGroupOptions,
        setLeadGroupOptions,
    ] = useState<BasicLeadGroup[] | undefined | null>(undefined);
    */

    const shouldFinalizeRef = useRef<boolean | undefined>(undefined);

    const primaryPageListComponentRef = useRef<VirtualizedEntryListComponent | null>(null);
    const secondaryPageListComponentRef = useRef<VirtualizedEntryListComponent | null>(null);

    const primaryPageLeftPaneRef = useRef<
        { setActiveTab: React.Dispatch<React.SetStateAction<TabOptions>> }
    >(null);
    const secondaryPageLeftPaneRef = useRef<
        { setActiveTab: React.Dispatch<React.SetStateAction<TabOptions>> }
    >(null);

    const [selectedEntry, setSelectedEntry] = useState<string | undefined>(undefined);

    // NOTE: Using useCallback because this needs to be called everytime to get
    // new clientId
    const defaultOptionVal = useCallback(
        (): PartialEntryType => ({
            clientId: `auto-${randomString()}`,
            entryType: 'EXCERPT',
            lead: leadId,
            excerpt: '',
            droppedExcerpt: '',
        }),
        [leadId],
    );

    const {
        pristine: leadPristine,
        value: leadValue,
        setValue: setLeadValue,
        setError: setLeadError,
        error: leadFormError,
        validate: leadFormValidate,
    } = useForm(leadSchema, leadInitialValue);

    // ENTRY FORM

    const [selectedSection, setSelectedSection] = useState<string | undefined>();

    const frameworkVariables = useMemo(
        (): ProjectFrameworkQueryVariables | undefined => (
            projectId ? { projectId } : undefined
        ),
        [projectId],
    );
    const {
        data: frameworkData,
        loading: frameworkLoading,
    } = useQuery<ProjectFrameworkQuery, ProjectFrameworkQueryVariables>(
        PROJECT_FRAMEWORK,
        {
            skip: isNotDefined(frameworkVariables),
            variables: frameworkVariables,
            onCompleted: (response) => {
                const projectFromResponse = response?.project;
                if (!projectFromResponse) {
                    return;
                }
                const analysisFrameworkFromResponse = projectFromResponse.analysisFramework;
                if (analysisFrameworkFromResponse) {
                    // Set first section or section from location state as active section
                    const firstSection = analysisFrameworkFromResponse.primaryTagging?.[0];
                    const sectionFromLocation = analysisFrameworkFromResponse
                        .primaryTagging?.find((section) => section.id === sectionIdFromLocation);

                    setSelectedSection(
                        sectionFromLocation
                            ? sectionFromLocation.clientId
                            : firstSection?.clientId,
                    );
                }
            },
        },
    );

    // eslint-disable-next-line max-len
    const frameworkDetails = frameworkData?.project?.analysisFramework as Framework | undefined | null;

    const allWidgets = useMemo(
        () => {
            const widgetsFromPrimary = frameworkDetails?.primaryTagging?.flatMap(
                (item) => (item.widgets ?? []),
            ) ?? [];
            const widgetsFromSecondary = frameworkDetails?.secondaryTagging ?? [];
            return [
                ...widgetsFromPrimary,
                ...widgetsFromSecondary,
            ];
        },
        [frameworkDetails?.primaryTagging, frameworkDetails?.secondaryTagging],
    );

    const schema = useMemo(
        () => {
            const widgetsMapping = listToMap(
                allWidgets,
                (item) => item.id,
                (item) => item,
            );

            return getSchema(widgetsMapping);
        },
        [allWidgets],
    );

    const {
        value: formValue,
        setValue: setFormValue,
        setFieldValue: setFormFieldValue,
        setError: setFormError,
        // pristine: formPristine,
        validate: formValidate,
        hasRestorePoint: isEntrySelectionActive,
        restore,
        createRestorePoint,
        clearRestorePoint,
        error: formError,
    } = useForm(schema, defaultFormValues);

    const entriesFormStale = useMemo(
        () => (formValue?.entries?.some((entry) => entry.stale) ?? false),
        [formValue?.entries],
    );

    const formPristine = !entriesFormStale && leadPristine;

    const staleIdentifiersRef = useRef<string[] | undefined>();
    const deleteIdentifiersRef = useRef<string[] | undefined>();

    const entriesToSaveRef = useRef<{
        deleteIds: NonNullable<BulkUpdateEntriesMutationVariables['deleteIds']>,
        entries: NonNullable<BulkUpdateEntriesMutationVariables['entries']>,
    } | undefined>();
    const entriesResponseRef = useRef<{
        errors: NonNullable<NonNullable<NonNullable<BulkUpdateEntriesMutation['project']>['entryBulk']>['errors']>;
        result: NonNullable<NonNullable<NonNullable<BulkUpdateEntriesMutation['project']>['entryBulk']>['result']>;
        deletedResult: NonNullable<NonNullable<NonNullable<BulkUpdateEntriesMutation['project']>['entryBulk']>['deletedResult']>;
    } | undefined>();

    const [entryImagesMap, setEntryImagesMap] = useState<EntryImagesMap | undefined>();
    const [
        entryAttachmentsMap,
        setEntryAttachmentMap,
    ] = useState<EntryAttachmentsMap | undefined>();

    const [leadAttachmentsMap, setLeadAttachmentsMap] = useState<LeadAttachmentsMap>({});

    const [
        updateLead,
        { loading: leadUpdatePending },
    ] = useMutation<LeadUpdateMutation, LeadUpdateMutationVariables>(
        UPDATE_LEAD,
        {
            onCompleted: (response) => {
                if (!response?.project?.leadUpdate) {
                    shouldFinalizeRef.current = undefined;
                    return;
                }
                const {
                    result,
                    ok,
                } = response.project.leadUpdate;

                if (!ok) {
                    alert.show(
                        shouldFinalizeRef.current
                            ? 'Failed to mark source as tagged!'
                            : 'Failed to update source.',
                        { variant: 'error' },
                    );
                } else {
                    const leadData = removeNull(result);
                    setLeadValue({
                        ...leadData,
                        attachment: leadData?.attachment?.id,
                        leadGroup: leadData?.leadGroup?.id,
                        assignee: leadData?.assignee?.id,
                        source: leadData?.source?.id,
                        authors: leadData?.authors?.map((author) => author.id),
                    });

                    alert.show(
                        shouldFinalizeRef.current
                            ? 'Successfully marked source as tagged!'
                            : 'Successfully updated source.',
                        { variant: 'success' },
                    );
                }
                shouldFinalizeRef.current = undefined;
            },
            onError: () => {
                alert.show(
                    shouldFinalizeRef.current
                        ? 'Failed to mark source as tagged!'
                        : 'Failed to update source!',
                    { variant: 'error' },
                );

                shouldFinalizeRef.current = undefined;
            },
        },
    );

    const handleLeadSave = useCallback(() => {
        // NOTE: let's save lead if we are finalizing it
        if (!projectId || (leadPristine && !shouldFinalizeRef.current)) {
            shouldFinalizeRef.current = undefined;
            return;
        }

        const submit = createSubmitHandler(
            leadFormValidate,
            (err) => {
                setLeadError(err);
                if (err) {
                    shouldFinalizeRef.current = undefined;
                }
            },
            (val) => {
                const data = val as LeadInputType;
                updateLead({
                    variables: {
                        data: {
                            ...data,
                            status: shouldFinalizeRef.current
                                ? 'TAGGED'
                                : undefined,
                        },
                        leadId,
                        projectId,
                    },
                });
            },
        );
        submit();
    }, [
        leadFormValidate,
        setLeadError,
        leadPristine,
        leadId,
        projectId,
        updateLead,
    ]);

    // NOTE: handling bulkUpdateEntriesPending because we are making another
    // request after one completes
    // This avoids loading flickers
    const [bulkUpdateEntriesPending, setBulkUpdateEntriesPending] = useState(false);
    const [
        bulkUpdateEntries,
    ] = useMutation<BulkUpdateEntriesMutation, BulkUpdateEntriesMutationVariables>(
        BULK_UPDATE_ENTRIES,
        {
            /*
            update: (cache, response) => {
                const bulkActions = response?.data?.project?.entryBulk;
                if (bulkActions && leadId) {
                    const errors = bulkActions.errors?.filter(isDefined) ?? [];
                    const deletedResult = bulkActions.deletedResult?.filter(isDefined) ?? [];
                    const result = bulkActions.result?.filter(isDefined) ?? [];
                    if (errors.length <= 0 && result.length + deletedResult.length > 0) {
                        console.warn('called');
                        cache.writeFragment({
                            data: {
                                __typename: 'LeadDetailType',
                                id: leadId,
                                status: null,
                            },
                            fragment: gql`
                                fragment NewLeadType on LeadDetailType {
                                    __typename
                                    id
                                    status
                                }
                            `,
                        });
                    }
                }
            },
            */
            onCompleted: (response) => {
                const entryBulk = response.project?.entryBulk;
                if (!entryBulk) {
                    shouldFinalizeRef.current = undefined;
                    entriesToSaveRef.current = undefined;
                    setBulkUpdateEntriesPending(false);
                    return;
                }

                if (!entriesToSaveRef.current) {
                    // NOTE: this case should never occur
                    // eslint-disable-next-line no-console
                    console.error('entriesToSaveRef should always be defined');
                    setBulkUpdateEntriesPending(false);
                    return;
                }

                if (entriesResponseRef.current) {
                    entriesResponseRef.current.errors.push(...(
                        entryBulk.errors ?? []
                    ));
                    entriesResponseRef.current.result.push(...(
                        entryBulk.result ?? []
                    ));
                    entriesResponseRef.current.deletedResult.push(...(
                        entryBulk.deletedResult ?? []
                    ));
                } else {
                    entriesResponseRef.current = {
                        errors: entryBulk.errors ?? [],
                        result: entryBulk.result ?? [],
                        deletedResult: entryBulk.deletedResult ?? [],
                    };
                }

                const nextDeleteIds = entriesToSaveRef.current.deleteIds.slice(
                    entriesResponseRef.current.deletedResult.length,
                    entriesResponseRef.current.deletedResult.length + DELETE_LEN,
                );
                const nextEntryIds = entriesToSaveRef.current.entries.slice(
                    entriesResponseRef.current.result.length,
                    entriesResponseRef.current.result.length + UPDATE_LEN,
                );

                if (nextDeleteIds.length > 0 || nextEntryIds.length > 0) {
                    if (!projectId) {
                        // NOTE: projectId should always be defined here
                        // eslint-disable-next-line no-console
                        console.error('No project id');
                    } else {
                        // setting this to true just in case
                        setBulkUpdateEntriesPending(true);
                        bulkUpdateEntries({
                            variables: {
                                projectId,
                                deleteIds: nextDeleteIds,
                                entries: nextEntryIds,
                            },
                        });
                    }
                    return;
                }

                const {
                    errors,
                    deletedResult,
                    result: saveResult,
                } = entriesResponseRef.current;

                const staleIdentifiers = staleIdentifiersRef.current;
                const deleteIdentifiers = deleteIdentifiersRef.current;

                const entriesError = errors?.map((item, index) => {
                    if (isNotDefined(item)) {
                        return undefined;
                    }
                    const clientId = staleIdentifiers?.[index];
                    if (isNotDefined(clientId)) {
                        return undefined;
                    }

                    return {
                        clientId,
                        error: transformToFormError(removeNull(item) as ObjectError[]),
                    };
                }).filter(isDefined) ?? [];

                const entriesErrorMapping = listToMap(
                    entriesError,
                    (item) => item.clientId,
                    (item) => item.error,
                );

                const deletedEntries = deletedResult.map((item, index) => {
                    if (isNotDefined(item)) {
                        return undefined;
                    }
                    const clientId = deleteIdentifiers?.[index];
                    return clientId;
                }).filter(isDefined) ?? [];

                const savedEntries = saveResult?.map((item, index) => {
                    if (item === null) {
                        return undefined;
                    }
                    const clientId = staleIdentifiers?.[index];
                    if (isNotDefined(clientId)) {
                        return undefined;
                    }

                    return {
                        clientId,
                        entry: transformEntry(item as Entry),
                    };
                }).filter(isDefined) ?? [];

                const savedEntriesMapping = listToMap(
                    savedEntries,
                    (item) => item.clientId,
                    (item) => item.entry,
                );

                const newImagesMap = listToMap(
                    saveResult?.map((item) => item?.image).filter(isDefined),
                    (item) => item.id,
                    (item) => item,
                );

                setEntryImagesMap((oldMap) => ({
                    ...oldMap,
                    ...newImagesMap,
                }));

                const newAttachmentMap = listToMap(
                    saveResult
                        ?.map((entry) => {
                            if (entry && entry.entryAttachment) {
                                return {
                                    entryClientId: entry.clientId,
                                    entryAttachment: entry.entryAttachment,
                                };
                            }
                            return undefined;
                        })
                        .filter(isDefined),
                    // NOTE: We are using entry.clientId as the key because we
                    // do not get entry.attachment.id on the entry
                    (d) => d.entryClientId,
                    (d) => d.entryAttachment,
                );
                setEntryAttachmentMap((oldMap) => ({
                    ...oldMap,
                    ...newAttachmentMap,
                }));

                setFormValue((oldValue) => {
                    const entries = oldValue?.entries ?? [];
                    const filteredEntries = entries.filter((item) => (
                        !deletedEntries.includes(item.clientId)
                    ));

                    const mappedEntries = filteredEntries.map((item) => {
                        const newEntry = savedEntriesMapping[item.clientId];
                        return newEntry ?? item;
                    });
                    return {
                        entries: mappedEntries,
                    };
                }, true);

                setFormError((oldError) => {
                    const err = getErrorObject(oldError);
                    return {
                        ...err,
                        entries: {
                            ...getErrorObject(err?.entries),
                            ...entriesErrorMapping,
                        },
                    };
                });

                const deleteErrorsCount = deletedResult.filter(isNotDefined).length;
                if (deleteErrorsCount > 0) {
                    alert.show(
                        `Failed to delete ${deleteErrorsCount} entries!`,
                        { variant: 'error' },
                    );
                }
                const deleteSuccessCount = deletedResult.filter(isDefined).length;
                if (deleteSuccessCount > 0) {
                    alert.show(
                        `Successfully deleted ${deleteSuccessCount} entry(s)!`,
                        { variant: 'success' },
                    );
                }

                const saveErrorsCount = saveResult?.filter(isNotDefined).length;
                if (saveErrorsCount > 0) {
                    alert.show(
                        `Failed to save ${saveErrorsCount} entry(s)!`,
                        { variant: 'error' },
                    );
                }
                const saveSuccessCount = saveResult?.filter(isDefined).length;
                if (saveSuccessCount > 0) {
                    alert.show(
                        `Successfully saved ${saveSuccessCount} entry(s)!`,
                        { variant: 'success' },
                    );
                }

                // eslint-disable-next-line max-len
                if (deleteErrorsCount + deleteSuccessCount + saveErrorsCount + saveSuccessCount <= 0) {
                    alert.show(
                        'Did nothing successfully!',
                        { variant: 'success' },
                    );
                }

                if (saveErrorsCount <= 0 && deleteErrorsCount <= 0) {
                    handleLeadSave();
                } else {
                    shouldFinalizeRef.current = undefined;
                }

                staleIdentifiersRef.current = undefined;
                deleteIdentifiersRef.current = undefined;
                entriesToSaveRef.current = undefined;
                entriesResponseRef.current = undefined;
                setBulkUpdateEntriesPending(false);
            },
            onError: (gqlError) => {
                // NOTE: not retrying/continuing if there is ApolloError
                alert.show(
                    'Failed to save entries!',
                    { variant: 'error' },
                );
                // eslint-disable-next-line no-console
                console.error(gqlError);

                shouldFinalizeRef.current = undefined;

                staleIdentifiersRef.current = undefined;
                deleteIdentifiersRef.current = undefined;
                entriesToSaveRef.current = undefined;
                entriesResponseRef.current = undefined;
                setBulkUpdateEntriesPending(false);
            },
        },
    );

    const handleEntriesSave = useCallback(
        () => {
            if (!projectId) {
                // eslint-disable-next-line no-console
                console.error('No project id');
                shouldFinalizeRef.current = undefined;
                return;
            }

            const submit = createSubmitHandler(
                formValidate,
                (err) => {
                    setFormError(err);
                    if (err) {
                        shouldFinalizeRef.current = undefined;
                    }
                },
                (value) => {
                    // FIXME: do not send entries with errors
                    const entriesWithError = value.entries ?? [];
                    const entriesWithoutError = (value.entries ?? []) as EntryInputType[];

                    const deletedEntries = entriesWithError
                        .filter((entry) => entry.deleted && entry.id);

                    const staleEntries = entriesWithoutError
                        .filter((entry) => entry.stale && !entry.deleted);

                    // NOTE: remembering the identifiers so that data and error
                    // can be patched later on
                    const deleteIds = deletedEntries?.map((entry) => entry.clientId);
                    const staleIds = staleEntries?.map((entry) => entry.clientId);
                    staleIdentifiersRef.current = staleIds;
                    deleteIdentifiersRef.current = deleteIds;

                    // NOTE: deleting all the entries that are not saved on server
                    setFormValue((oldValue) => ({
                        entries: oldValue.entries?.filter(
                            (entry) => entry.id || !entry.deleted,
                        ),
                    }));

                    // NOTE: let's try to save lead if entries is all good
                    if (deletedEntries.length <= 0 && staleEntries.length <= 0) {
                        handleLeadSave();
                        return;
                    }

                    const entryDeleteIds = deletedEntries
                        .map((entry) => entry.id)
                        // NOTE: we do not need this filter as entry.id is always defined
                        .filter(isDefined);

                    // FIXME: this is repeated
                    const transformedEntries = staleEntries
                        .map((entry) => {
                            const hiddenWidgetIds = getHiddenWidgetIds(
                                allWidgets,
                                entry.attributes ?? [],
                            );

                            return {
                                ...entry,
                                deleted: undefined,
                                stale: undefined,
                                attributes: entry.attributes
                                    ?.filter((attribute) => isDefined(attribute.data))
                                    .filter((attribute) => !hiddenWidgetIds[attribute.widget])
                                    .map((attribute) => ({
                                        ...attribute,
                                        widgetVersion: attribute.widgetVersion,
                                        widgetType: undefined,
                                    })),
                            };
                        });

                    entriesToSaveRef.current = {
                        deleteIds: entryDeleteIds,
                        entries: transformedEntries,
                    };

                    const entriesToSave = entriesToSaveRef.current;

                    setBulkUpdateEntriesPending(true);
                    bulkUpdateEntries({
                        variables: {
                            projectId,
                            deleteIds: entriesToSave.deleteIds.slice(
                                0,
                                DELETE_LEN,
                            ),
                            entries: entriesToSave.entries.slice(
                                0,
                                UPDATE_LEN,
                            ),
                        },
                    });
                },
            );
            submit();
        },
        [
            handleLeadSave,
            setFormError,
            formValidate,
            bulkUpdateEntries,
            projectId,
            setFormValue,
            allWidgets,
        ],
    );

    const handleSaveClick = useCallback(
        () => {
            shouldFinalizeRef.current = false;
            handleEntriesSave();
        },
        [handleEntriesSave],
    );

    const handleFinalizeClick = useCallback(
        () => {
            shouldFinalizeRef.current = true;
            handleEntriesSave();
        },
        [handleEntriesSave],
    );

    const handleEntryClick = useCallback((entryId: string) => {
        createRestorePoint();
        setSelectedEntry(entryId);
    }, [createRestorePoint]);

    // FIXME: check if we need to do this? also memoize this?
    const currentEntryIndex = formValue.entries?.findIndex(
        (entry) => entry.clientId === selectedEntry,
    ) ?? -1;

    // FIXME: check if we need to do this?
    const currentEntry = formValue.entries?.[currentEntryIndex];

    const entriesError = useMemo(
        () => getErrorObject(getErrorObject(formError)?.entries),
        [formError],
    );

    const entriesErrorStateMap = useMemo(
        () => mapToMap(entriesError, (k) => k, (err) => analyzeErrors(err)),
        [entriesError],
    );

    const currentEntryError = currentEntry
        ? getErrorObject(entriesError?.[currentEntry.clientId])
        : undefined;

    const {
        setValue: onEntryChange,
    } = useFormArray<'entries', PartialEntryType>('entries', setFormFieldValue);

    const handleEntryChange = useCallback(
        (val: SetValueArg<PartialEntryType>, otherName: number | undefined) => {
            onEntryChange(
                (oldValue) => {
                    const newVal = !isCallable(val)
                        ? val
                        : val(oldValue);
                    return { ...newVal, stale: true };
                },
                otherName,
            );
        },
        [onEntryChange],
    );

    const handleEntryCreate = useCallback(
        (newValue: PartialEntryType) => {
            const defaultAttributes = createDefaultAttributes(allWidgets);
            createRestorePoint();
            setFormFieldValue(
                (prevValue: PartialFormType['entries']) => [
                    ...(prevValue ?? []),
                    {
                        ...newValue,
                        stale: true,
                        attributes: defaultAttributes,
                    },
                ],
                'entries',
            );
            setSelectedEntry(newValue.clientId);
        },
        [
            setFormFieldValue,
            createRestorePoint,
            allWidgets,
        ],
    );

    const handleAssistedEntryAdd = useCallback(
        (
            newValue: PartialEntryType,
            newGeoAreaOptions?: GeoArea[],
            selectCreatedEntry = false,
        ) => {
            if (selectCreatedEntry) {
                createRestorePoint();
            }
            setFormFieldValue(
                (prevValue: PartialFormType['entries']) => [
                    ...(prevValue ?? []),
                    {
                        ...newValue,
                        stale: true,
                    },
                ],
                'entries',
            );
            if (selectCreatedEntry) {
                setSelectedEntry(newValue.clientId);
            }
            if (newGeoAreaOptions && newGeoAreaOptions.length > 0) {
                setGeoAreaOptions((oldAreas) => {
                    const newAreas = unique([
                        ...(oldAreas ?? []),
                        ...newGeoAreaOptions,
                    ], (area) => area.id);
                    return newAreas;
                });
            }
        },
        [
            setFormFieldValue,
            createRestorePoint,
        ],
    );

    const handleEntryChangeApprove = useCallback(
        () => {
            clearRestorePoint();
            setSelectedEntry(undefined);
        },
        [clearRestorePoint],
    );

    const handleEntryChangeDiscard = useCallback(
        () => {
            restore();
            setSelectedEntry(undefined);
        },
        [restore],
    );

    // FIXME: check if we need to do this?
    const onEntryFieldChange = useFormObject(
        currentEntryIndex === -1 ? undefined : currentEntryIndex,
        handleEntryChange,
        defaultOptionVal,
    );

    // FIXME: check if we need to do this?
    const handleExcerptChange = useCallback(
        (_: string, excerpt: string | undefined) => {
            onEntryFieldChange(excerpt, 'excerpt');
        },
        [onEntryFieldChange],
    );

    // FIXME: check if we need to do this?
    const handleEntryDelete = useCallback(
        () => {
            // NOTE: add note why we are clearing restore point
            clearRestorePoint();
            onEntryFieldChange(true, 'deleted');
            setSelectedEntry(undefined);
        },
        [onEntryFieldChange, clearRestorePoint],
    );

    // FIXME: check if we need to do this?
    const handleEntryRestore = useCallback(
        () => {
            // NOTE: add note why we are clearing restore point
            clearRestorePoint();
            onEntryFieldChange(false, 'deleted');
            setSelectedEntry(undefined);
        },
        [onEntryFieldChange, clearRestorePoint],
    );

    const handleAttachmentClick = useCallback((attachment: LeadPreviewAttachmentType) => {
        if (handleEntryCreate) {
            handleEntryCreate({
                clientId: randomString(),
                entryType: 'ATTACHMENT',
                lead: leadId,
                leadAttachment: attachment.id,
                excerpt: '',
                droppedExcerpt: '',
            });
            setLeadAttachmentsMap((oldValue) => ({
                ...oldValue,
                [attachment.id]: attachment,
            }));
        }
    }, [leadId, handleEntryCreate]);

    // NOTE: we are creating a map of index and value because we are iterating
    // over widgets but modifying attributes
    const attributesMap = useMemo(() => (
        listToMap(
            currentEntry?.attributes ?? [],
            (d) => d.widget,
            (d, _, i) => ({
                index: i,
                value: d,
            }),
        )
    ), [currentEntry?.attributes]);

    const {
        setValue: onAttributeChange,
    } = useFormArray('attributes', onEntryFieldChange);

    // ENTRY
    const handleAddButtonClick = useCallback((entryId: string, sectionId?: string) => {
        handleEntryClick(entryId);

        if (sectionId) {
            primaryPageLeftPaneRef?.current?.setActiveTab('entries');
            setTimeout(
                () => {
                    // NOTE: we use setTimeout with zero time so that 'entries'
                    // tab is already mounted before we try to scroll to
                    // selected entry
                    primaryPageListComponentRef?.current?.scrollTo(entryId);
                },
                0,
            );

            setSelectedSection(sectionId);

            window.location.replace('#/primary-tagging');
        } else {
            secondaryPageLeftPaneRef?.current?.setActiveTab('entries');
            setTimeout(
                () => {
                    // NOTE: we use setTimeout with zero time so that 'entries'
                    // tab is already mounted before we try to scroll to
                    // selected entry
                    secondaryPageListComponentRef?.current?.scrollTo(entryId);
                },
                0,
            );

            window.location.replace('#/secondary-tagging');
        }
    }, [handleEntryClick]);

    const entriesVariables = useMemo(
        (): LeadEntriesQueryVariables | undefined => (
            (leadId && projectId) ? { projectId, leadId } : undefined
        ),
        [
            leadId,
            projectId,
        ],
    );
    const {
        data,
        loading: entriesLoading,
    } = useQuery<LeadEntriesQuery, LeadEntriesQueryVariables>(
        LEAD_ENTRIES,
        {
            skip: isNotDefined(entriesVariables),
            variables: entriesVariables,
            onCompleted: (response) => {
                const projectFromResponse = response?.project;
                if (!projectFromResponse) {
                    return;
                }

                const leadFromResponse = projectFromResponse.lead;
                if (leadFromResponse) {
                    // FIXME: server sends entries in reverse order
                    // FIXME: use a better way to sort entries
                    const entries = [...(leadFromResponse.entries) ?? []]
                        .sort((foo, bar) => compareDate(
                            new Date(foo.createdAt),
                            new Date(bar.createdAt),
                        ))
                        .map((entry) => transformEntry(entry as Entry));

                    setVerifiedIdsMap(
                        listToMap(
                            leadFromResponse.entries ?? [],
                            (entry) => entry.id,
                            (entry) => entry.verifiedBy?.map(
                                (verifiyingUser) => verifiyingUser.id,
                            ).filter(isDefined),
                        ),
                    );
                    setControlledMap(
                        listToMap(
                            leadFromResponse.entries ?? [],
                            (entry) => entry.id,
                            (entry) => !!entry.controlled,
                        ),
                    );
                    setCommentsCountMap(
                        listToMap(
                            leadFromResponse.entries ?? [],
                            (entry) => entry.id,
                            (entry) => entry.reviewCommentsCount,
                        ),
                    );
                    const geoData = leadFromResponse.entries
                        ?.map((entry) => entry?.attributes)
                        .flat()
                        .map((attributes) => attributes?.geoSelectedOptions)
                        .flat()
                        .filter(isDefined) ?? [];
                    const uniqueGeoData = unique(geoData, (d) => d.id);

                    setGeoAreaOptions(uniqueGeoData);
                    setFormValue((oldVal) => ({ ...oldVal, entries }));
                    const imagesMap = listToMap(
                        leadFromResponse.entries
                            ?.map((entry) => entry.image)
                            .filter(isDefined),
                        (d) => d.id,
                        (d) => d,
                    );
                    setEntryImagesMap(imagesMap);

                    const attachmentMap = listToMap(
                        leadFromResponse.entries
                            ?.map((entry) => {
                                if (entry && entry.entryAttachment) {
                                    return {
                                        entryClientId: entry.clientId,
                                        entryAttachment: entry.entryAttachment,
                                    };
                                }
                                return undefined;
                            })
                            .filter(isDefined),
                        // NOTE: We are using entry.clientId as the key because we
                        // do not get entry.attachment.id on the entry
                        (d) => d.entryClientId,
                        (d) => d.entryAttachment,
                    );
                    setEntryAttachmentMap(attachmentMap);

                    const finalEntryIdFromLocation = entryIdFromLocation
                        ?? entries?.find(
                            (e) => e.id === String(entryServerIdFromLocation),
                        )?.clientId;

                    if (finalEntryIdFromLocation) {
                        createRestorePoint();
                        setSelectedEntry(finalEntryIdFromLocation);

                        if (activePageFromLocation === 'primary') {
                            primaryPageLeftPaneRef?.current?.setActiveTab('entries');
                            setTimeout(
                                () => {
                                    // NOTE: we use setTimeout with zero time so that 'entries'
                                    // tab is already mounted before we try to scroll to
                                    // selected entry
                                    primaryPageListComponentRef?.current?.scrollTo(
                                        finalEntryIdFromLocation,
                                    );
                                },
                                0,
                            );
                        } else if (activePageFromLocation === 'secondary') {
                            secondaryPageLeftPaneRef?.current?.setActiveTab('entries');
                            setTimeout(
                                () => {
                                    // NOTE: we use setTimeout with zero time so that 'entries'
                                    // tab is already mounted before we try to scroll to
                                    // selected entry
                                    secondaryPageListComponentRef?.current?.scrollTo(
                                        finalEntryIdFromLocation,
                                    );
                                },
                                0,
                            );
                        }
                    }

                    const leadData = removeNull(leadFromResponse);
                    setLeadValue({
                        ...leadData,
                        attachment: leadData.attachment?.id,
                        leadGroup: leadData.leadGroup?.id,
                        assignee: leadData.assignee?.id,
                        source: leadData.source?.id,
                        authors: leadData.authors?.map((author) => author.id),
                    });
                    const {
                        // leadGroup,
                        assignee,
                        authors,
                        source,
                    } = leadData;

                    /*
                    if (leadGroup) {
                        setLeadGroupOptions((oldVal) => (
                            oldVal ? [...oldVal, leadGroup] : [leadGroup]
                        ));
                    }
                    */

                    if (assignee) {
                        setProjectUserOptions((oldVal) => (
                            oldVal ? [...oldVal, assignee] : [assignee]
                        ));
                    }
                    if (source) {
                        setSourceOrganizationOptions((oldVal) => (
                            oldVal ? [...oldVal, source] : [source]
                        ));
                    }
                    if (authors) {
                        setAuthorOrganizationOptions((oldVal) => (
                            oldVal ? [...oldVal, ...authors] : [...authors]
                        ));
                    }
                }
            },
        },
    );

    // FIXME: can't use leadStatus from query because the underlying types are
    // different
    // const leadStatus = data?.project?.lead?.status;
    const leadStatus = leadValue?.status;

    const handleApplyToAll = useCallback(
        (entryId: string, widgetId: string, applyBelowOnly?: boolean) => {
            setFormFieldValue(
                (prevValue: PartialFormType['entries']) => {
                    if (!prevValue) {
                        // eslint-disable-next-line no-console
                        console.error('No entry found');
                        return prevValue;
                    }
                    const referenceEntryIndex = prevValue.findIndex(
                        (item) => item.clientId === entryId,
                    );
                    if (referenceEntryIndex === -1) {
                        // eslint-disable-next-line no-console
                        console.error('No entry found');
                        return prevValue;
                    }
                    const referenceEntry = prevValue[referenceEntryIndex];
                    const referenceAttribute = referenceEntry.attributes?.find(
                        (item) => item.widget === widgetId,
                    );
                    // iterate over entries,
                    // update stale and inject attributes

                    return prevValue.map((entry, index) => {
                        if (entry.clientId === entryId) {
                            return entry;
                        }
                        if (applyBelowOnly && index <= referenceEntryIndex) {
                            return entry;
                        }

                        const newAttributes = [...(entry.attributes ?? [])];

                        const attributeIndex = newAttributes.findIndex(
                            (attribute) => attribute.widget === widgetId,
                        );

                        if (attributeIndex !== -1) {
                            if (referenceAttribute) {
                                const oldValue = newAttributes[attributeIndex];
                                newAttributes.splice(attributeIndex, 1, {
                                    ...referenceAttribute,
                                    id: oldValue.id,
                                    clientId: oldValue.clientId,
                                });
                            } else {
                                delete newAttributes[attributeIndex];
                            }
                        } else if (referenceAttribute) {
                            newAttributes.push({
                                ...referenceAttribute,
                                id: undefined,
                                clientId: randomString(),
                            });
                        }

                        return {
                            ...entry,
                            stale: true,
                            attributes: newAttributes,
                        };
                    });
                },
                'entries',
            );
        },
        [setFormFieldValue],
    );

    const onEntryVerificationStatusChange = useCallback((entryId: string) => {
        setVerifiedIdsMap((oldMap = {}) => {
            const currentVerifiedList = oldMap[entryId];
            if (!currentVerifiedList) {
                return { ...oldMap, [entryId]: [user?.id].filter(isDefined) };
            }
            const isAlreadyVerified = currentVerifiedList.some(
                (verifiyingUser) => verifiyingUser === user?.id,
            );
            return {
                ...oldMap,
                [entryId]: isAlreadyVerified
                    ? currentVerifiedList.filter((verifiyingUser) => verifiyingUser !== user?.id)
                    : [...currentVerifiedList, user?.id].filter(isDefined),
            };
        });
    }, [user?.id]);

    const onEntryControlledStatusChange = useCallback((entryId: string) => {
        setControlledMap((oldMap = {}) => ({
            ...oldMap,
            [entryId]: !oldMap?.[entryId],
        }));
    }, []);

    const entryDataRendererParams = useCallback(
        (entryId: string, datum: PartialEntryType, index: number) => ({
            value: datum,
            name: index,
            projectId,
            index,
            onChange: handleEntryChange,
            secondaryTagging: frameworkDetails?.secondaryTagging,
            onAddButtonClick: handleAddButtonClick,
            primaryTagging: frameworkDetails?.primaryTagging,
            excerptHeaderActions: datum.id && projectId && (
                <>
                    <EntryVerification
                        entryId={datum.id}
                        projectId={projectId}
                        verifiedBy={verifiedIdsMap?.[datum.id]}
                        onVerificationChange={onEntryVerificationStatusChange}
                        compact
                    />
                    <EntryControl
                        entryId={datum.id}
                        projectId={projectId}
                        value={!!controlledMap?.[datum.id]}
                        onChange={onEntryControlledStatusChange}
                        compact
                    />
                    <EntryCommentWrapper
                        entryId={datum.id}
                        projectId={projectId}
                        modalLeftContent={(
                            <ExcerptInput
                                value={datum.excerpt}
                                image={datum?.image ? entryImagesMap?.[datum.image] : undefined}
                                imageRaw={undefined}
                                entryType={datum.entryType}
                                entryAttachment={entryAttachmentsMap?.[datum.id]}
                                readOnly
                            />
                        )}
                    />
                </>
            ),
            leadId,
            rightComponent: (
                <ExcerptInput
                    value={datum.excerpt}
                    image={datum?.image ? entryImagesMap?.[datum.image] : undefined}
                    imageRaw={undefined}
                    entryType={datum.entryType}
                    entryAttachment={datum.id ? entryAttachmentsMap?.[datum.id] : undefined}
                    readOnly
                />
            ),
            disabled: !!selectedEntry,
            entryImage: datum?.image ? entryImagesMap?.[datum.image] : undefined,
            entryAttachment: entryAttachmentsMap?.[entryId],
            leadAttachment: datum.leadAttachment
                ? leadAttachmentsMap?.[datum.leadAttachment]
                : undefined,
            error: entriesError?.[entryId],
            geoAreaOptions,
            onGeoAreaOptionsChange: setGeoAreaOptions,
            onApplyToAll: handleApplyToAll,
            allWidgets,
        }),
        [
            entryAttachmentsMap,
            controlledMap,
            onEntryControlledStatusChange,
            verifiedIdsMap,
            onEntryVerificationStatusChange,
            allWidgets,
            geoAreaOptions,
            projectId,
            handleAddButtonClick,
            entryImagesMap,
            frameworkDetails?.secondaryTagging,
            frameworkDetails?.primaryTagging,
            handleEntryChange,
            leadId,
            selectedEntry,
            entriesError,
            handleApplyToAll,
            leadAttachmentsMap,
        ],
    );

    const rightComponentForEntry = useMemo(
        () => (isObject(currentEntry) && (
            <ExcerptInput
                value={currentEntry.excerpt}
                image={currentEntry.image
                    ? entryImagesMap?.[currentEntry.image]
                    : undefined}
                imageRaw={undefined}
                entryType={currentEntry.entryType}
                entryAttachment={currentEntry.clientId
                    ? entryAttachmentsMap?.[currentEntry.clientId]
                    : undefined}
                readOnly
            />
        )),
        [
            entryAttachmentsMap,
            currentEntry,
            entryImagesMap,
        ],
    );

    const lead = data?.project?.lead;
    const loading = frameworkLoading
        || entriesLoading
        || bulkUpdateEntriesPending
        || leadUpdatePending;

    const disableFinalizeButton = useMemo(() => {
        if (loading) {
            return true;
        }

        // NOTE: If any entry is selected, we'll disable the button
        if (selectedEntry) {
            return true;
        }

        if ((formValue.entries?.length ?? 0) < 1) {
            return true;
        }

        // NOTE: If entries form is not edited and lead's status is already tagged
        // we don't need to finalize the lead
        if (!entriesFormStale && leadStatus === 'TAGGED') {
            return true;
        }

        return false;
    }, [
        selectedEntry,
        entriesFormStale,
        loading,
        leadStatus,
        formValue.entries,
    ]);

    usePromptOnCloseAndRefresh(formPristine);

    return (
        <div className={_cs(styles.entryEdit, className)}>
            <Prompt
                message={(newLocation) => {
                    if (newLocation.pathname !== location.pathname && !formPristine) {
                        return _ts('common', 'youHaveUnsavedChanges');
                    }
                    return true;
                }}
            />
            <Tabs
                useHash
                defaultHash="source-details"
            >
                <SubNavbarContext.Provider value={navbarContextValue}>
                    <SubNavbarIcons>
                        {project?.isTest && <TestTag />}
                    </SubNavbarIcons>
                    <SubNavbar
                        className={styles.header}
                        heading="Source"
                        description={lead?.title}
                        homeLinkShown
                        defaultActions={(
                            <>
                                <BackLink defaultLink="/">
                                    Close
                                </BackLink>
                                <Button
                                    name={undefined}
                                    disabled={formPristine || !!selectedEntry || loading}
                                    onClick={handleSaveClick}
                                >
                                    Save
                                </Button>
                                <ConfirmButton
                                    name={undefined}
                                    disabled={disableFinalizeButton}
                                    variant="primary"
                                    onConfirm={handleFinalizeClick}
                                    message="Finalizing the source will mark it as tagged.
                                    Are you sure you want to finalize the source and all its entries?"
                                >
                                    Finalize
                                </ConfirmButton>
                            </>
                        )}
                    >
                        <TabList>
                            <Tab
                                name="source-details"
                                transparentBorder
                                disabled={isEntrySelectionActive}
                            >
                                Source Details
                            </Tab>
                            <Tab
                                name="primary-tagging"
                                transparentBorder
                                disabled={isEntrySelectionActive}
                            >
                                Primary Tagging
                            </Tab>
                            <Tab
                                name="secondary-tagging"
                                transparentBorder
                                disabled={isEntrySelectionActive}
                            >
                                Secondary Tagging
                            </Tab>
                            <Tab
                                name="review"
                                transparentBorder
                                disabled={isEntrySelectionActive}
                            >
                                Review
                            </Tab>
                        </TabList>
                    </SubNavbar>
                </SubNavbarContext.Provider>
                <CommentCountContext.Provider value={commentCountContext}>
                    <div className={styles.tabPanelContainer}>
                        {loading && <PendingMessage />}
                        <TabPanel
                            activeClassName={styles.tabPanel}
                            name="source-details"
                            retainMount="lazy"
                        >
                            {projectId && (
                                <SourceDetails
                                    leadValue={leadValue}
                                    setValue={setLeadValue}
                                    leadFormError={leadFormError}
                                    pending={loading}
                                    projectId={projectId}
                                    sourceOrganizationOptions={sourceOrganizationOptions}
                                    onSourceOrganizationOptionsChange={setSourceOrganizationOptions}
                                    authorOrganizationOptions={authorOrganizationOptions}
                                    onAuthorOrganizationOptionsChange={setAuthorOrganizationOptions}
                                    // leadGroupOptions={leadGroupOptions}
                                    // onLeadGroupOptionsChange={setLeadGroupOptions}
                                    assigneeOptions={projectUserOptions}
                                    onAssigneeOptionChange={setProjectUserOptions}
                                    attachment={lead?.attachment}
                                />
                            )}
                        </TabPanel>
                        <TabPanel
                            activeClassName={styles.tabPanel}
                            name="primary-tagging"
                            retainMount="eager"
                        >
                            <div className={styles.primaryTagging}>
                                <LeftPaneEntries
                                    className={styles.sourcePreview}
                                    projectId={projectId}
                                    entries={formValue.entries}
                                    onAssistedEntryAdd={handleAssistedEntryAdd}
                                    activeEntry={selectedEntry}
                                    onEntryClick={handleEntryClick}
                                    onEntryCreate={handleEntryCreate}
                                    onApproveButtonClick={handleEntryChangeApprove}
                                    onDiscardButtonClick={handleEntryChangeDiscard}
                                    activeTabRef={primaryPageLeftPaneRef}
                                    onEntryDelete={handleEntryDelete}
                                    onEntryRestore={handleEntryRestore}
                                    onExcerptChange={handleExcerptChange}
                                    // NOTE: These 2 are for handling attachment/images/tables
                                    onAttachmentClick={handleAttachmentClick}
                                    leadAttachmentsMap={leadAttachmentsMap}
                                    lead={lead}
                                    leadId={leadId}
                                    listComponentRef={primaryPageListComponentRef}
                                    entryImagesMap={entryImagesMap}
                                    entryAttachmentsMap={entryAttachmentsMap}
                                    isEntrySelectionActive={isEntrySelectionActive}
                                    entriesError={entriesErrorStateMap}
                                    frameworkDetails={frameworkDetails ?? undefined}
                                />
                                <Container
                                    className={_cs(className, styles.sections)}
                                    headerActions={(
                                        <FrameworkImageButton
                                            frameworkId={frameworkDetails?.id}
                                            label={_ts('analyticalFramework.primaryTagging', 'viewFrameworkImageButtonLabel')}
                                            variant="secondary"
                                        />
                                    )}
                                    contentClassName={styles.content}
                                >
                                    <Tabs
                                        value={selectedSection}
                                        onChange={setSelectedSection}
                                        variant="step"
                                    >
                                        <TabList className={styles.tabs}>
                                            {frameworkDetails?.primaryTagging?.map((section) => (
                                                <Tab
                                                    key={section.clientId}
                                                    name={section.clientId}
                                                    borderWrapperClassName={
                                                        styles.borderWrapper
                                                    }
                                                    className={_cs(
                                                        styles.tab,
                                                        // analyzeErrors(
                                                        // error?.[section.clientId])
                                                        // && styles.errored,
                                                    )}
                                                    title={section.tooltip ?? undefined}
                                                >
                                                    {section.title}
                                                </Tab>
                                            ))}
                                        </TabList>
                                        {frameworkDetails?.primaryTagging?.map((section) => (
                                            <TabPanel
                                                key={section.clientId}
                                                name={section.clientId}
                                                activeClassName={styles.panel}
                                            >
                                                <Section
                                                    key={selectedEntry}
                                                    allWidgets={allWidgets}
                                                    widgets={section.widgets}
                                                    attributesMap={attributesMap}
                                                    onAttributeChange={onAttributeChange}
                                                    readOnly={!currentEntry}
                                                    error={currentEntryError?.attributes}
                                                    geoAreaOptions={geoAreaOptions}
                                                    onGeoAreaOptionsChange={setGeoAreaOptions}
                                                    rightComponent={rightComponentForEntry}
                                                />
                                            </TabPanel>
                                        ))}
                                    </Tabs>
                                </Container>
                            </div>
                        </TabPanel>
                        <TabPanel
                            activeClassName={styles.tabPanel}
                            name="secondary-tagging"
                            retainMount="eager"
                        >
                            <div className={styles.secondaryTagging}>
                                <LeftPaneEntries
                                    className={styles.sourcePreview}
                                    onAssistedEntryAdd={handleAssistedEntryAdd}
                                    projectId={projectId}
                                    entries={formValue.entries}
                                    activeEntry={selectedEntry}
                                    onEntryClick={handleEntryClick}
                                    onEntryCreate={handleEntryCreate}
                                    onEntryDelete={handleEntryDelete}
                                    onEntryRestore={handleEntryRestore}
                                    // FIXME: maybe move the entries change inside
                                    onExcerptChange={handleExcerptChange}
                                    onApproveButtonClick={handleEntryChangeApprove}
                                    onDiscardButtonClick={handleEntryChangeDiscard}
                                    lead={lead}
                                    leadId={leadId}
                                    entryAttachmentsMap={entryAttachmentsMap}
                                    hideSimplifiedPreview
                                    hideOriginalPreview
                                    listComponentRef={secondaryPageListComponentRef}
                                    entryImagesMap={entryImagesMap}
                                    isEntrySelectionActive={isEntrySelectionActive}
                                    entriesError={entriesErrorStateMap}
                                    activeTabRef={secondaryPageLeftPaneRef}
                                    frameworkDetails={frameworkDetails ?? undefined}
                                    onAttachmentClick={handleAttachmentClick}
                                    leadAttachmentsMap={leadAttachmentsMap}
                                />
                                <Container
                                    className={styles.rightContainer}
                                    contentClassName={styles.frameworkOutput}
                                    headerActions={(
                                        <FrameworkImageButton
                                            frameworkId={frameworkDetails?.id}
                                            label={_ts('analyticalFramework.primaryTagging', 'viewFrameworkImageButtonLabel')}
                                            variant="secondary"
                                        />
                                    )}
                                >
                                    <Section
                                        key={selectedEntry}
                                        allWidgets={allWidgets}
                                        widgets={frameworkDetails?.secondaryTagging}
                                        attributesMap={attributesMap}
                                        onAttributeChange={onAttributeChange}
                                        readOnly={!currentEntry}
                                        error={currentEntryError?.attributes}
                                        geoAreaOptions={geoAreaOptions}
                                        onGeoAreaOptionsChange={setGeoAreaOptions}
                                        rightComponent={rightComponentForEntry}
                                    />
                                </Container>
                            </div>
                        </TabPanel>
                        <TabPanel
                            name="review"
                            activeClassName={styles.tabPanel}
                            retainMount="lazy"
                        >
                            {frameworkDetails && (
                                <Container
                                    className={styles.review}
                                    headerActions={(
                                        <FrameworkImageButton
                                            frameworkId={frameworkDetails.id}
                                            label="View framework image for reference"
                                            variant="secondary"
                                        />
                                    )}
                                    contentClassName={styles.reviewContent}
                                >
                                    {(formValue.entries?.length ?? 0) > 0
                                        ? (
                                            <VirtualizedListView
                                                itemHeight={360}
                                                keySelector={entryKeySelector}
                                                renderer={EntryInput}
                                                data={formValue.entries}
                                                direction="vertical"
                                                spacing="comfortable"
                                                rendererParams={entryDataRendererParams}
                                                filtered={false}
                                                errored={false}
                                                pending={false}
                                                emptyIcon={(
                                                    <Kraken
                                                        variant="search"
                                                        size="large"
                                                    />
                                                )}
                                                emptyMessage="No entries found"
                                                messageIconShown
                                                messageShown
                                            />
                                        ) : (
                                            <div className={styles.noEntriesFound}>
                                                <Message
                                                    icon={(
                                                        <Kraken
                                                            variant="search"
                                                            size="large"
                                                        />
                                                    )}
                                                    message="No entries found."
                                                />
                                            </div>
                                        )}

                                </Container>
                            )}
                        </TabPanel>
                    </div>
                </CommentCountContext.Provider>
            </Tabs>
        </div>
    );
}

export default EntryEdit;
