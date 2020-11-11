import React, { useState, useCallback, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import ExcerptOutput from '#widgetComponents/ExcerptOutput';
import DateOutput from '#components/viewer/DateOutput';
import EntryCommentButton from '#components/general/EntryCommentButton';
import EntryDeleteButton from '#components/general/EntryDeleteButton';
import EntryEditButton from '#components/general/EntryEditButton';
import EntryOpenLink from '#components/general/EntryOpenLink';
import EntryVerify from '#components/general/EntryVerify';
import Cloak from '#components/general/Cloak';
import Button from '#rsca/Button';
import WarningButton from '#rsca/Button/WarningButton';
import modalize from '#rscg/Modalize';
import useRequest from '#utils/request';
import LoadingAnimation from '#rscv/LoadingAnimation';

import LeadPreview from '#views/Leads/LeadPreview';
import LeadEditModal from '#components/general/LeadEditModal';

import {
    EntryFields,
    OrganizationFields,
    EntryType,
    Entry,
    EntryLeadType,
} from '#typings/entry';
import {
    Lead,
} from '#typings/lead';
import {
    Permission,
} from '#typings/common';
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

    const tooltipValue = value.map(o => o.title).join(', ');
    const displayValue = value.map(o => o.shortName ?? o.title).join(', ');

    return (
        <div
            className={_cs(styles.authorListOutput, className)}
            title={_ts('entries.qualityControl', 'authorListTooltip', { authors: tooltipValue })}
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
    onLeadChange: (lead: Pick<Lead, EntryLeadType>) => void;
}

function EntryCard(props: EntryCardProps) {
    const {
        className,
        entry: entryFromProps,
        lead,
        framework,
        onDelete,
        isDeleted,
        onLeadChange,
    } = props;

    const [isEditLeadModalShown, showEditLeadModal] = React.useState<boolean>(false);
    const [entry, setEntry] = React.useState<Entry>(entryFromProps);
    const [isVerified, setVerificationStatus] = React.useState<boolean>(entry.verified);

    const {
        url: leadUrlFromProps,
        attachment,
    } = lead;

    const [verifiyChangePending, setVerifyChangePending] = useState(false);

    const leadUrl = (attachment && attachment.file) ?? leadUrlFromProps;

    const leadSource = lead.sourceDetail ? lead.sourceDetail.title : lead.sourceRaw;

    const [
        pending,
        leadFromRequest,
        ,
        getLead,
    ] = useRequest<Lead>({
        url: `server://v2/leads/${lead.id}/`,
        method: 'GET',
    });

    useEffect(() => {
        if(leadFromRequest) {
            showEditLeadModal(true);
        }
    },[leadFromRequest]);

    const handleDeletePendingChange = useCallback((/* isPending: boolean */) => {
        // TODO; disable all actions if pending
    }, []);

    const handleDeleteSuccess = useCallback(() => {
        onDelete(entry.id);
    }, [onDelete, entry]);

    const handleEditLeadButtonClick = () => {
        getLead();
    };

    const handleEditLeadModalClose = () => {
        showEditLeadModal(false);
    };

    const handleLeadEditSave = useCallback((lead: Lead) => {
        onLeadChange(lead);
    },[onLeadChange]);

    const shouldHideLeadEdit = ({ leadPermissions }: { leadPermissions: Permission }) => !leadPermissions.modify
    const isConfidential = lead.confidentiality === 'confidential';

    const loading = verifiyChangePending;

    return (
        <div className={_cs(className, styles.entryCardContainer)}>
            {loading && <LoadingAnimation />}
            <div
                className={_cs(
                    styles.entryCard,
                    isVerified && styles.verified,
                    isDeleted && styles.deleted,
                    isConfidential && styles.confidential,
                )}
            >
                <section className={styles.top}>
                    <div className={styles.row}>
                        <AuthorListOutput
                            className={styles.authorList}
                            value={lead.authorsDetail}
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
                        {leadUrl ? (
                            <ModalButton
                                className={styles.leadTitleButton}
                                transparent
                                title={lead.title}
                                modal={
                                    <LeadPreview value={lead} />
                                }
                            >
                                {lead.title}
                            </ModalButton>
                        ) : (
                            <div className={styles.leadTitleButton}>
                                {lead.title}
                            </div>
                        )}
                        <Cloak
                            hide={shouldHideLeadEdit}
                            render={
                                <WarningButton
                                iconName="edit"
                                transparent
                                disabled={pending || isEditLeadModalShown}
                                onClick={handleEditLeadButtonClick}
                                />
                            }
                        />
                        {
                            isEditLeadModalShown && leadFromRequest && (
                                <LeadEditModal
                                    leadId={leadFromRequest.id}
                                    lead={leadFromRequest}
                                    closeModal={handleEditLeadModalClose}
                                    onSave={handleLeadEditSave}
                                />
                            )
                        }
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
                                { lead.sourceDetail ? lead.sourceDetail.title : lead.sourceRaw }
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
                            onPendingChange={setVerifyChangePending}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

export default EntryCard;
