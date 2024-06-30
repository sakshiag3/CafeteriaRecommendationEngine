export class Util {
    public static async getCurrentDateRange() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  
    public static formatRecommendationsToTable(recommendations: any[]) {
      let table = '+----+-------------+--------------------+--------+--------------+------------------+---------------+\n';
      table += '| ID | Name        | Description        | Price  | Avg Rating   | Sentiment Score  | Category      |\n';
      table += '+----+-------------+--------------------+--------+--------------+------------------+---------------+\n';
      recommendations.forEach(rec => {
        const avgRating = rec.avgRating !== undefined ? rec.avgRating.toFixed(2) : 'N/A';
        const sentimentScore = rec.sentimentScore !== undefined ? rec.sentimentScore.toFixed(2) : 'N/A';
        table += `| ${rec.menuItem.id.toString().padEnd(2)} | ${rec.menuItem.name.padEnd(11)} | ${rec.menuItem.description.padEnd(18)} | ${rec.menuItem.price.toString().padEnd(6)} | ${avgRating.padEnd(12)} | ${sentimentScore.padEnd(15)} | ${rec.menuItem.category.name.padEnd(13)} |\n`;
      });
      table += '+----+-------------+--------------------+--------+--------------+------------------+---------------+\n';
      return table;
    }
  
    public static formatSelectedRecommendationsToTables(recommendations: any[]) {
      const breakfastItems = recommendations.filter(r => r.meal === 'Breakfast');
      const lunchItems = recommendations.filter(r => r.meal === 'Lunch');
      const dinnerItems = recommendations.filter(r => r.meal === 'Dinner');
  
      const formatTable = (title: string, items: any[]) => {
        let table = `${title}:\n`;
        table += '+----+-----------------+--------------------+-------+------------+\n';
        table += '| ID | Name            | Description        | Price | Available  |\n';
        table += '+----+-----------------+--------------------+-------+------------+\n';
        items.forEach((item) => {
          const availabilityStatus = item.menuItem.availabilityStatus ? 'Yes' : 'No';
          table += `| ${String(item.menuItem.id).padEnd(2)} | ${item.menuItem.name.padEnd(15)} | ${item.menuItem.description.padEnd(18)} | ${String(item.menuItem.price).padEnd(5)} | ${availabilityStatus.padEnd(10)} |\n`;
        });
        table += '+----+-----------------+--------------------+-------+------------+\n';
        return table;
      };
  
      const breakfastTable = formatTable('Breakfast', breakfastItems);
      const lunchTable = formatTable('Lunch', lunchItems);
      const dinnerTable = formatTable('Dinner', dinnerItems);
  
      return `${breakfastTable}\n${lunchTable}\n${dinnerTable}`;
    }
  
    public static formatVotesToTable(voteCounts: { [key: string]: number }) {
      let table = 'Votes:\n';
      table += '+----+---------------------+------------+\n';
      table += '| ID | Menu Item           | Vote Count |\n';
      table += '+----+---------------------+------------+\n';
      Object.keys(voteCounts).forEach((menuItemIdName) => {
        table += `| ${menuItemIdName.padEnd(21)} | ${String(voteCounts[menuItemIdName]).padEnd(10)} |\n`;
      });
      table += '+----+---------------------+------------+\n';
      return table;
    }
  }
  