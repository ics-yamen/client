import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import ExcerptOutput from '#widgetComponents/ExcerptOutput';
import DateOutput from '#components/viewer/DateOutput';
import EntryCommentButton from '#components/general/EntryCommentButton';
import EntryDeleteButton from '#components/general/EntryDeleteButton';
import EntryEditButton from '#components/general/EntryEditButton';
import EntryOpenLink from '#components/general/EntryOpenLink';
import EntryVerify from '#components/general/EntryVerify';
import Button from '#rsca/Button';
import modalize from '#rscg/Modalize';

import LeadPreview from '#views/Leads/LeadPreview';
import {
    EntryFields,
    OrganizationFields,
    EntryType,
    Entry,
} from '#typings/entry';
import {
    FrameworkFields,
} from '#typings/framework';

import _ts from '#ts';

import styles from './styles.scss';

const ModalButton = modalize(Button);

interface AuthorListOutputProps {
    className?: string;
    value: OrganizationFields[];
}

const entryTypeToValueMap: {
    [key in EntryType]: keyof EntryFields;
} = {
    excerpt: 'excerpt',
    image: 'image',
    dataSeries: 'tabularFieldData',
};

const entryTypeToExcerptTypeMap: {
    [key in EntryType]: 'text' | 'image' | 'dataSeries';
} = {
    excerpt: 'text',
    image: 'image',
    dataSeries: 'dataSeries',
};

function AuthorListOutput(props: AuthorListOutputProps) {
    const {
        className,
        value = [],
    } = props;

    const displayValue = value.map(o => o.title).join(', ');

    return (
        <div
            className={_cs(styles.authorListOutput, className)}
            title={_ts('entries.qualityControl', 'authorListTooltip', { authors: displayValue })}
        >
            { value.length > 0 && (
                <Icon
                    className={styles.icon}
                    name="userGroup"
                />
            )}
            <div className={styles.value}>
                {displayValue}
            </div>
        </div>
    );
}

interface EntryCardProps {
    className?: string;
    entry: Entry;
    lead: EntryFields['lead'];
    framework: FrameworkFields;
    isDeleted?: boolean;
    onDelete: (entryId: EntryFields['id']) => void;
}

function EntryCard(props: EntryCardProps) {
    const {
        className,
        entry: entryFromProps,
        lead,
        framework,
        onDelete,
        isDeleted,
    } = props;

    const {
        url: leadUrlFromProps,
        attachment,
    } = lead;

    const leadUrl = (attachment && attachment.file) ?? leadUrlFromProps;

    const leadSource = lead.sourceDetails ? lead.sourceDetails.title : lead.sourceRaw;

    const handleDeletePendingChange = React.useCallback((/* isPending: boolean */) => {
        // TODO; disable all actions if pending
    }, []);

    const [entry, setEntry] = React.useState<Entry>(entryFromProps);
    const [isVerified, setVerificationStatus] = React.useState<boolean>(entry.verified);

    const handleDeleteSuccess = React.useCallback(() => {
        onDelete(entry.id);
    }, [onDelete, entry]);

    return (
        <div className={
        _cs(
            className,
            styles.entryCard,
            isVerified && styles.verified,
            isDeleted && styles.deleted,
        )}
        >
            <section className={styles.top}>
                <div className={styles.row}>
                    <AuthorListOutput
                        className={styles.authorList}
                        value={lead.authorsDetails}
                    />
                    <DateOutput
                        className={styles.publishedOn}
                        value={lead.publishedOn}
                        tooltip={_ts('entries.qualityControl', 'leadPublishedOnTooltip')}
                    />
                    {lead.pageCount && (
                        <div
                            className={styles.pageCount}
                            title={_ts('entries.qualityControl', 'leadPageCountTooltip')}
                        >
                            <Icon
                                className={styles.icon}
                                name="book"
                            />
                            <div className={styles.value}>
                                {lead.pageCount}
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.titleRow}>
                    <div
                        className={styles.title}
                        title={lead.title}
                    >
                        {lead.title}
                    </div>
                    {leadUrl && (
                        <ModalButton
                            className={styles.leadTitleButton}
                            transparent
                            iconName="externalLink"
                            modal={
                                <LeadPreview value={lead} />
                            }
                        />
                    )}
                </div>
            </section>
            <section className={styles.middle}>
                <div className={styles.row}>
                    <ExcerptOutput
                        className={styles.excerptOutput}
                        type={entryTypeToExcerptTypeMap[entry.entryType]}
                        value={entry[entryTypeToValueMap[entry.entryType]]}
                    />
                </div>
            </section>
            <section className={styles.bottom}>
                <div className={styles.row}>
                    <div className={styles.source}>
                        { leadSource && (
                              <Icon
                                  name="world"
                                  className={styles.title}
                              />
                          )}
                        <div
                            className={styles.value}
                            title={_ts('entries.qualityControl', 'leadSourceTooltip', { leadSource })}
                        >
                            { lead.sourceDetails ? lead.sourceDetails.title : lead.sourceRaw }
                        </div>
                    </div>
                    <div className={styles.confidentiality}>
                        { lead.confidentialityDisplay }
                    </div>
                </div>
                <div className={styles.entryDetailsRow}>
                    <div
                        className={styles.createdBy}
                        title={_ts('entries.qualityControl', 'leadCreatedByTooltip', { user: entry.createdByName })}
                    >
                        { entry.createdByName }
                    </div>
                    <DateOutput
                        className={styles.createdAt}
                        value={entry.createdAt}
                        tooltip={_ts('entries.qualityControl', 'entryCreatedOnTooltip')}
                    />
                </div>
                <div className={styles.actions}>
                    <EntryDeleteButton
                        entryId={entry.id}
                        onPendingChange={handleDeletePendingChange}
                        onDeleteSuccess={handleDeleteSuccess}
                        disabled={isDeleted}
                    />
                    <EntryOpenLink
                        entryId={entry.id}
                        leadId={entry.lead}
                        projectId={entry.project}
                        disabled={isDeleted}
                    />
                    <EntryCommentButton
                        entryId={entry.id}
                        commentCount={entry.unresolvedCommentCount}
                        assignee={lead.assigneeDetails.id}
                        disabled={isDeleted}
                    />
                    <EntryEditButton
                        entry={entry}
                        framework={framework}
                        disabled={isDeleted}
                        onEditSuccess={setEntry}
                    />
                    <EntryVerify
                        title={entry.verificationLastChangedByDetails ? (
                            _ts(
                                'entries',
                                'verificationLastChangedBy',
                                {
                                    userName: entry
                                        .verificationLastChangedByDetails.displayName,
                                },
                            )
                        ) : undefined}
                        value={isVerified}
                        entryId={entry.id}
                        leadId={entry.lead}
                        disabled={isDeleted}
                        handleEntryVerify={setVerificationStatus}
                    // onPendingChange={}
                    />
                </div>
            </section>
        </div>
    );
}

export default EntryCard;
