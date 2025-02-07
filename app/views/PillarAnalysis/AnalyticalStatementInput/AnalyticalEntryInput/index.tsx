import React, { memo, useMemo, useCallback, useContext } from 'react';
import { generatePath } from 'react-router-dom';
import {
    IoTrashOutline,
    IoPeopleCircleOutline,
    IoOpenOutline,
    IoPencilOutline,
    IoRepeat,
    IoArrowDownOutline,
    IoArrowUpOutline,
} from 'react-icons/io5';
import {
    DropContainer,
    DraggableContent,
    QuickActionButton,
    DateOutput,
    useBooleanState,
    TextOutput,
    QuickActionLink,
} from '@the-deep/deep-ui';
import {
    Error,
    getErrorObject,
} from '@togglecorp/toggle-form';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import { useModalState } from '#hooks/stateManagement';
import _ts from '#ts';
import NonFieldError from '#components/NonFieldError';
import ExcerptInput from '#components/entry/ExcerptInput';
import LeadPreviewButton from '#components/lead/LeadPreviewButton';
import EditableEntry from '#components/entry/EditableEntry';
import { GeoArea } from '#components/GeoMultiSelectInput';
import {
    organizationShortNameSelector,
    organizationTitleSelector,
} from '#components/selections/NewOrganizationMultiSelectInput';
import routes from '#base/configs/routes';

import EntryContext, { transformEntry } from '../../context';
import { AnalyticalEntryType, PartialAnalyticalEntryType } from '../../schema';
import { DroppedValue } from '../index';
import { Framework } from '../..';

import styles from './styles.css';

interface AnalyticalEntryInputProps {
    statementClientId: string | undefined;
    value: PartialAnalyticalEntryType;
    error: Error<AnalyticalEntryType> | undefined;
    // onChange: (value: PartialAnalyticalEntryType, index: number) => void;
    onRemove: (index: number) => void;
    index: number;
    onAnalyticalEntryDrop: (
        droppedValue: DroppedValue,
        dropOverEntryClientId: string | undefined,
    ) => void;
    onAnalyticalEntryDown: (
        dropOverEntryClientId: string,
    ) => void;
    onAnalyticalEntryUp: (
        dropOverEntryClientId: string,
    ) => void;
    dropDisabled?: boolean;
    entryUpButtonDisable?: boolean;
    entryDownButtonDisable?: boolean;
    framework: Framework;
    projectId: string;
    geoAreaOptions: GeoArea[] | undefined | null;
    setGeoAreaOptions: React.Dispatch<React.SetStateAction<GeoArea[] | undefined | null>>;
    onEntryDataChange: () => void;
    // framework: Framework | undefined | null;
}

function AnalyticalEntryInput(props: AnalyticalEntryInputProps) {
    const {
        value,
        error: riskyError,
        // onChange,
        onRemove,
        index,
        statementClientId,
        onAnalyticalEntryDrop,
        onAnalyticalEntryDown,
        onAnalyticalEntryUp,
        dropDisabled,
        framework,
        projectId,
        geoAreaOptions,
        setGeoAreaOptions,
        onEntryDataChange,
        entryUpButtonDisable,
        entryDownButtonDisable,
    } = props;

    const error = getErrorObject(riskyError);

    const [
        entryDraggedStatus,
        setDragStart,
        setDragEnd,
    ] = useModalState(false);

    const [
        entryCardFlipped,
        , , ,
        toggleEntryCardFlipped,
    ] = useBooleanState(false);

    const handleAnalyticalEntryAdd = useCallback(
        (val: Record<string, unknown> | undefined) => {
            if (!val) {
                return;
            }
            const typedVal = val as { entryId: string, statementClientId: string };
            onAnalyticalEntryDrop(typedVal, value.clientId);
        },
        [value, onAnalyticalEntryDrop],
    );

    const dragValue = useMemo(() => ({
        entryId: value.entry,
        statementClientId,
    }), [value.entry, statementClientId]);

    const { entries } = useContext(EntryContext);
    const entry = value.entry ? entries[value.entry] : undefined;

    const authors = useMemo(() => (
        entry?.lead.authors
            ?.map((author) => (
                organizationShortNameSelector(author) ?? organizationTitleSelector(author)
            )).join(', ')
    ), [entry?.lead]);

    const editEntryLink = useMemo(() => ({
        pathname: generatePath(routes.entryEdit.path, {
            projectId,
            leadId: entry?.lead.id,
        }),
        state: {
            entryId: entry?.clientId,
            activePage: 'primary',
        },
        hash: '#/primary-tagging',
    }), [
        projectId,
        entry?.lead.id,
        entry?.clientId,
    ]);

    // const onFieldChange = useFormObject(index, value, onChange);

    return (
        <DropContainer
            className={_cs(
                styles.dropContainer,
                entryDraggedStatus && styles.hide,
            )}
            name="entry"
            // NOTE: Disabled drop on the same entry which is being dragged
            onDrop={!entryDraggedStatus ? handleAnalyticalEntryAdd : undefined}
            dropOverlayContainerClassName={styles.overlay}
            draggedOverClassName={styles.draggedOver}
            contentClassName={styles.content}
            disabled={dropDisabled}
            // TODO: disable this when entries count is greater than certain count
        >
            <DraggableContent
                className={_cs(
                    styles.entry,
                    entryCardFlipped && styles.isFlipped,
                )}
                name="entry"
                dropEffect="move"
                value={dragValue}
                onDragStart={setDragStart}
                onDragStop={setDragEnd}
                contentClassName={styles.content}
                headerIcons={(
                    <>
                        <IoPeopleCircleOutline className={styles.headingItem} />
                        <span
                            title={authors}
                            className={_cs(styles.authors, styles.headingItem)}
                        >
                            {authors}
                        </span>
                        <LeadPreviewButton
                            className={styles.previewButton}
                            title={entry?.lead.title}
                            label={(<IoOpenOutline />)}
                            url={entry?.lead.url}
                            attachment={entry?.lead.attachment}
                        />
                    </>
                )}
                heading={(
                    <DateOutput
                        className={styles.headingItem}
                        format="dd/MM/yyyy"
                        value={entry?.lead.publishedOn}
                    />
                )}
                headingClassName={styles.heading}
                headingSectionClassName={styles.headingSection}
                headingContainerClassName={styles.headingContainer}
                headingSize="extraSmall"
                headerActionsContainerClassName={styles.headerActions}
                headerActions={(
                    <>
                        {isDefined(value?.clientId) && (
                            <>
                                <QuickActionButton
                                    name={value.clientId}
                                    title="Move entry up"
                                    variant="transparent"
                                    onClick={onAnalyticalEntryUp}
                                    disabled={entryUpButtonDisable}
                                >
                                    <IoArrowUpOutline />
                                </QuickActionButton>
                                <QuickActionButton
                                    name={value.clientId}
                                    title="Move entry down"
                                    variant="transparent"
                                    onClick={onAnalyticalEntryDown}
                                    disabled={entryDownButtonDisable}
                                >
                                    <IoArrowDownOutline />
                                </QuickActionButton>
                            </>
                        )}
                        <QuickActionLink
                            title="Edit entry"
                            to={editEntryLink}
                            variant="transparent"
                        >
                            <IoPencilOutline />
                        </QuickActionLink>
                        <QuickActionButton
                            name={index}
                            onClick={onRemove}
                            title={_ts('pillarAnalysis', 'removeAnalyticalEntryButtonTitle')}
                            variant="transparent"
                        >
                            <IoTrashOutline />
                        </QuickActionButton>
                        <QuickActionButton
                            name={undefined}
                            onClick={toggleEntryCardFlipped}
                            title="flip"
                            variant="transparent"
                        >
                            <IoRepeat />
                        </QuickActionButton>
                    </>
                )}
            >
                <NonFieldError error={error} />
                <NonFieldError error={error?.entry} />
                {entry && !entryCardFlipped && (
                    <ExcerptInput
                        className={styles.excerpt}
                        value={entry.excerpt}
                        image={entry.image}
                        entryType={entry.entryType}
                        entryAttachment={entry.entryAttachment}
                        readOnly
                        imageRaw={undefined}
                    />
                )}
                {entry && entryCardFlipped && (
                    <>
                        <div className={styles.extraDetails}>
                            <TextOutput
                                label="Created Date"
                                value={<DateOutput value={entry.createdAt} />}
                            />
                            <TextOutput
                                label="Added By"
                                value={entry.createdBy?.displayName}
                            />
                        </div>
                        <EditableEntry
                            className={styles.entryDetail}
                            entry={transformEntry(entry)}
                            entryId={entry.id}
                            leadId={entry.lead.id}
                            projectId={projectId}
                            primaryTagging={framework?.primaryTagging}
                            secondaryTagging={framework?.secondaryTagging}
                            entryImage={entry.image}
                            controlled={entry.controlled}
                            verifiedBy={entry.verifiedBy}
                            geoAreaOptions={geoAreaOptions}
                            onGeoAreaOptionsChange={setGeoAreaOptions}
                            onEntryDataChange={onEntryDataChange}
                            entryAttachment={entry.entryAttachment}
                            compact
                            noPaddingInWidgetContainer
                        />
                    </>
                )}
            </DraggableContent>
        </DropContainer>
    );
}

export default memo(AnalyticalEntryInput);
