import React, { useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { _cs } from '@togglecorp/fujs';
import { FiEdit2 } from 'react-icons/fi';
import {
    IoCopyOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import {
    Container,
    ContainerCard,
    Button,
    ListView,
    QuickActionConfirmButton,
    ExpandableContainer,
    TextOutput,
    PendingMessage,
} from '@the-deep/deep-ui';
import {
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
    LabelList,
    Bar,
} from 'recharts';

import ProgressLine from '#components/viz/ProgressLine';
import DateRangeOutput from '#dui/DateRangeOutput';

import {
    AppState,
    PillarSummary,
    AnalysisSummary,
} from '#typings';

import _ts from '#ts';
import { activeProjectIdFromStateSelector } from '#redux';
import PillarAnalysisList from './PillarList';
import PillarAssignment from './PillarAssignment';

import styles from './styles.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    const radius = 10;
    if (value === 0) {
        return null;
    }

    return (
        <g>
            <text
                x={x + (width / 2)}
                y={y - radius}
                fill="#717171"
                textAnchor="middle"
                dominantBaseline="middle"
            >
                {`${Math.round(value)}%`}
            </text>
        </g>
    );
};

interface ComponentProps {
    analysisId: number;
    className?: string;
    title: string;
    startDate?: string;
    endDate?: string;
    activeProject: number;
    onEdit: (analysisId: number) => void;
    onAnalysisPillarDelete: () => void;
    teamLeadName: string;
    createdAt: string;
    modifiedAt: string;
    onDelete: (value: number) => void;
    pendingAnalysisDelete: boolean;
    onClone: (value: number, title: string) => void;
    pendingAnalysisClone: boolean;
    analysisPillars: PillarSummary[];
    frameworkOverview: AnalysisSummary['frameworkOverview'];
    totalEntries: number;
    totalSources: number;
    analyzedEntries: number;
    analyzedSources: number;
}

const mapStateToProps = (state: AppState) => ({
    activeProject: activeProjectIdFromStateSelector(state),
});

const pillarSummaryKeySelector = (item: PillarSummary) => (item.id);

function Analysis(props: ComponentProps) {
    const {
        title,
        modifiedAt,
        className,
        startDate,
        endDate,
        activeProject,
        analysisId,
        teamLeadName,
        onAnalysisPillarDelete,
        analysisPillars: analysisPillarsFromProps,
        createdAt,
        onEdit,
        onDelete,
        pendingAnalysisDelete,
        onClone,
        analyzedEntries,
        analyzedSources,
        totalEntries,
        totalSources,
        pendingAnalysisClone,
        frameworkOverview,
    } = props;

    const handleEditClick = useCallback(() => {
        onEdit(analysisId);
    }, [analysisId, onEdit]);

    const handleCloneAnalysis = useCallback(() => {
        onClone(analysisId, title);
    }, [analysisId, onClone, title]);

    const pillarAssignmentRendererParams = useCallback(
        (_: number, data: PillarSummary) => ({
            assigneeName: data.assignee,
            pillarTitle: data.pillarTitle,
            entriesAnalyzed: data.entriesAnalyzed,
            totalEntries,
        }),
        [totalEntries],
    );

    const handleDeleteAnalysis = useCallback(() => {
        onDelete(analysisId);
    }, [analysisId, onDelete]);

    const barChartData = useMemo(() => (
        frameworkOverview.map(o => ({
            ...o,
            percent: Math.round(
                (o.entriesAnalyzed / (totalEntries === 0 ? 1 : totalEntries)) * 10000,
            ) / 100,
        }))
    ), [frameworkOverview, totalEntries]);

    const disabled = pendingAnalysisDelete || pendingAnalysisClone;

    return (
        <ContainerCard
            className={_cs(className, styles.analysisItem)}
            heading={title}
            headingSize="small"
            headerDescription={(
                <DateRangeOutput
                    startDate={startDate}
                    endDate={endDate}
                />
            )}
            headerActions={(
                <>
                    <Button
                        name="edit"
                        onClick={handleEditClick}
                        disabled={disabled}
                        variant="tertiary"
                        icons={(
                            <FiEdit2 />
                        )}
                    >
                        {_ts('analysis', 'editAnalysisTitle')}
                    </Button>
                    <QuickActionConfirmButton
                        name="clone"
                        onConfirm={handleCloneAnalysis}
                        disabled={disabled}
                        title={_ts('analysis', 'cloneAnalysisButtonTitle')}
                        message={_ts('analysis', 'cloneAnalysisConfirmMessage')}
                        showConfirmationInitially={false}
                        variant="secondary"
                    >
                        <IoCopyOutline />
                    </QuickActionConfirmButton>
                    <QuickActionConfirmButton
                        name="delete"
                        onConfirm={handleDeleteAnalysis}
                        disabled={disabled}
                        title={_ts('analysis', 'deleteAnalysisButtonTitle')}
                        message={_ts('analysis', 'deleteAnalysisConfirmMessage')}
                        variant="secondary"
                        showConfirmationInitially={false}
                    >
                        <IoTrashOutline />
                    </QuickActionConfirmButton>
                </>
            )}
            horizontallyCompactContent
            contentClassName={styles.content}
        >
            {pendingAnalysisDelete && <PendingMessage />}
            <div className={styles.analysisDetails}>
                <div className={styles.metaSection}>
                    <TextOutput
                        className={styles.teamLeadName}
                        label={_ts('analysis', 'teamLead')}
                        value={teamLeadName}
                        hideLabelColon
                        block
                    />
                    <TextOutput
                        className={styles.pillarAssignments}
                        label={_ts('analysis', 'pillarAssignments')}
                        valueContainerClassName={styles.overflowWrapper}
                        block
                        hideLabelColon
                        value={(
                            <ListView
                                className={styles.pillarAssignmentList}
                                data={analysisPillarsFromProps}
                                renderer={PillarAssignment}
                                rendererParams={pillarAssignmentRendererParams}
                                keySelector={pillarSummaryKeySelector}
                            />
                        )}
                    />
                </div>
                <ContainerCard
                    className={styles.overviewContainer}
                    heading={_ts('analysis', 'overviewSectionHeader')}
                    headerClassName={styles.overviewHeader}
                    headingSize="small"
                >
                    <ProgressLine
                        progress={(analyzedSources / totalSources) * 100}
                        title={_ts('analysis', 'sourcesAnalyzedLabel')}
                        variant="complement1"
                    />
                    <ProgressLine
                        progress={(analyzedEntries / totalEntries) * 100}
                        title={_ts('analysis', 'entriesAnalyzedLabel')}
                        variant="complement2"
                    />
                </ContainerCard>
                <Container
                    className={styles.frameworkOverviewContainer}
                    heading={_ts('analysis', 'frameworkOverviewHeader')}
                    headingSize="small"
                    horizontallyCompactContent
                    contentClassName={styles.frameworkOverviewContent}
                >
                    <ResponsiveContainer className={styles.responsiveContainer}>
                        <BarChart
                            data={barChartData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <XAxis
                                dataKey="title"
                                axisLine={false}
                                tickLine={false}
                            />
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--dui-color-background-information)"
                            />
                            <YAxis
                                axisLine={false}
                                domain={[0, 100]}
                                tickCount={5}
                                tickLine={false}
                            />
                            <Bar
                                dataKey="percent"
                                fill="var(--dui-color-accent)"
                                background={{
                                    fill: 'var(--dui-color-background-information)',
                                }}
                                maxBarSize={16}
                            >
                                <LabelList
                                    // NOTE: LabelList required data for some reason
                                    data={[]}
                                    dataKey="percent"
                                    content={renderCustomizedLabel}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Container>
            </div>
            <ExpandableContainer
                className={styles.pillarAnalyses}
                headerClassName={styles.pillarAnalysesHeader}
                heading={_ts('analysis', 'pillarAnalysisCount', { count: analysisPillarsFromProps.length })}
                headingSize="extraSmall"
                sub
                alwaysMountContent={false}
                contentClassName={styles.pillarAnalysisList}
            >
                <PillarAnalysisList
                    createdAt={createdAt}
                    analysisId={analysisId}
                    modifiedAt={modifiedAt}
                    activeProject={activeProject}
                    onAnalysisPillarDelete={onAnalysisPillarDelete}
                />
            </ExpandableContainer>
        </ContainerCard>
    );
}

export default connect(mapStateToProps)(Analysis);
