'use-client';

import { Report, SeedReport } from "../interfaces/interfaces";
import { StrikeGridItem } from "./StrikeGridItem";

interface Props {
    reports: Report[];
}

export const StrikeGrid = ({ reports }: Props) => {
    return (
        <div className='grid grid-cols-2 sm:grid-cols-2 gap-10 mb-10 mx-3 bg-white'>
            {
                reports
                    .filter(report => !report.resuelto)
                    .map(report => (
                        <StrikeGridItem
                            key={report.idReporte}
                            report={report}
                        />
                    ))
            }

        </div>
    )
}
