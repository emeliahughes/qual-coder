import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Col, Row, Container, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { ArrowLeft, Download, BarChart, GraphUp, ArrowLeftRight, Link, People, Search, Filter } from 'react-bootstrap-icons';
import axios from 'axios';
import { API_BASE_URL } from './api';

// Statistical Analysis Functions
const calculateCorrelation = (data1, data2) => {
  const n = data1.length;
  if (n !== data2.length || n === 0) return 0;
  
  const sum1 = data1.reduce((a, b) => a + b, 0);
  const sum2 = data2.reduce((a, b) => a + b, 0);
  const sum1Sq = data1.reduce((a, b) => a + b * b, 0);
  const sum2Sq = data2.reduce((a, b) => a + b * b, 0);
  const pSum = data1.reduce((a, b, i) => a + b * data2[i], 0);
  
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  
  return den === 0 ? 0 : num / den;
};



const renderCorrelationAnalysis = (stats, results) => {
  const correlations = [];
  
  // Get all unique tags with their categories
  const tagWithCategory = new Map(); // tag -> category
  const allTags = new Set();
  
  results.forEach(r => {
    if (r.status !== 'excluded' && r.categories) {
      const categories = r.categories.split(';');
      categories.forEach(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > -1) {
          const category = pair.substring(0, colonIndex).trim();
          const tagsStr = pair.substring(colonIndex + 1).trim();
          if (tagsStr) {
            tagsStr.split(',').forEach(tag => {
              const cleanTag = tag.trim();
              allTags.add(cleanTag);
              tagWithCategory.set(cleanTag, category);
            });
          }
        }
      });
    }
  });
  
  const tagArray = Array.from(allTags);
  
  // Calculate correlations between all tag pairs
  for (let i = 0; i < tagArray.length; i++) {
    for (let j = i + 1; j < tagArray.length; j++) {
      const tag1 = tagArray[i];
      const tag2 = tagArray[j];
      
      // Create binary vectors for each video (1 = tag present, 0 = tag absent)
      const tag1Vector = results.map(r => {
        if (r.status === 'excluded' || !r.categories) return 0;
        const videoTags = [];
        r.categories.split(';').forEach(pair => {
          const colonIndex = pair.indexOf(':');
          if (colonIndex > -1) {
            const tagsStr = pair.substring(colonIndex + 1).trim();
            if (tagsStr) {
              videoTags.push(...tagsStr.split(',').map(t => t.trim()));
            }
          }
        });
        return videoTags.includes(tag1) ? 1 : 0;
      });
      
      const tag2Vector = results.map(r => {
        if (r.status === 'excluded' || !r.categories) return 0;
        const videoTags = [];
        r.categories.split(';').forEach(pair => {
          const colonIndex = pair.indexOf(':');
          if (colonIndex > -1) {
            const tagsStr = pair.substring(colonIndex + 1).trim();
            if (tagsStr) {
              videoTags.push(...tagsStr.split(',').map(t => t.trim()));
            }
          }
        });
        return videoTags.includes(tag2) ? 1 : 0;
      });
      
      const correlation = calculateCorrelation(tag1Vector, tag2Vector);
      
      // Only include correlations that are meaningful (not 0)
      if (Math.abs(correlation) > 0.01) {
        correlations.push({
          tag1: tag1,
          tag2: tag2,
          category1: tagWithCategory.get(tag1),
          category2: tagWithCategory.get(tag2),
          correlation: correlation
        });
      }
    }
  }
  
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  return (
    <div>
      <h6>Cross-Category Tag Correlations (Top 20 Most Correlated Pairs)</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Equation:</strong> Pearson's r = Σ(x-x̄)(y-ȳ) / √[Σ(x-x̄)² × Σ(y-ȳ)²]<br/>
        Where x,y are binary vectors (1=tag present, 0=tag absent) for each video<br/>
        Shows which tags from different categories tend to appear together
      </small>
      {correlations.length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Tag 1 (Category)</th>
              <th>Tag 2 (Category)</th>
              <th>Correlation</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody>
            {correlations.slice(0, 20).map((corr, index) => (
              <tr key={index}>
                <td><strong>{corr.tag1}</strong><br/><small className="text-muted">({corr.category1})</small></td>
                <td><strong>{corr.tag2}</strong><br/><small className="text-muted">({corr.category2})</small></td>
                <td className="text-center">{corr.correlation.toFixed(3)}</td>
                <td className="text-center">
                  <span className={`badge ${Math.abs(corr.correlation) > 0.7 ? 'bg-danger' : 
                    Math.abs(corr.correlation) > 0.5 ? 'bg-warning' : 
                    Math.abs(corr.correlation) > 0.1 ? 'bg-info' : 'bg-secondary'}`}>
                    {Math.abs(corr.correlation) > 0.7 ? 'Strong' : 
                     Math.abs(corr.correlation) > 0.5 ? 'Moderate' : 
                     Math.abs(corr.correlation) > 0.1 ? 'Weak' : 'None'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No correlations found.</p>
      )}
    </div>
  );
};

const renderCooccurrenceAnalysis = (stats, results) => {
  const allTags = new Set();
  const tagWithCategory = new Map(); // tag -> category
  const tagCooccurrence = {};
  
  // Collect all tags with their categories
  results.forEach(result => {
    if (result.categories && result.status !== 'excluded') {
      const categories = result.categories.split(';');
      categories.forEach(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > -1) {
          const category = pair.substring(0, colonIndex).trim();
          const tagsStr = pair.substring(colonIndex + 1).trim();
          if (tagsStr) {
            tagsStr.split(',').forEach(tag => {
              const cleanTag = tag.trim();
              allTags.add(cleanTag);
              tagWithCategory.set(cleanTag, category);
            });
          }
        }
      });
    }
  });
  
  // Initialize co-occurrence matrix
  allTags.forEach(tag1 => {
    tagCooccurrence[tag1] = {};
    allTags.forEach(tag2 => {
      tagCooccurrence[tag1][tag2] = 0;
    });
  });
  
  // Calculate co-occurrences
  results.forEach(result => {
    if (result.categories && result.status !== 'excluded') {
      const tags = result.categories.split(';').flatMap(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) return [];
        const tags = pair.substring(colonIndex + 1).trim();
        return tags.split(',').map(t => t.trim()).filter(t => t);
      });
      
      tags.forEach(tag1 => {
        tags.forEach(tag2 => {
          if (tag1 !== tag2) {
            tagCooccurrence[tag1][tag2]++;
          }
        });
      });
    }
  });
  
  // Find top co-occurring pairs
  const cooccurrencePairs = [];
  allTags.forEach(tag1 => {
    allTags.forEach(tag2 => {
      if (tag1 < tag2 && tagCooccurrence[tag1][tag2] > 0) {
        cooccurrencePairs.push({
          tag1,
          tag2,
          category1: tagWithCategory.get(tag1),
          category2: tagWithCategory.get(tag2),
          count: tagCooccurrence[tag1][tag2]
        });
      }
    });
  });
  
  cooccurrencePairs.sort((a, b) => b.count - a.count);
  
  return (
    <div>
      <h6>Cross-Category Tag Co-occurrences (Top 15 Most Frequent Pairs)</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Method:</strong> Counts how often tags from different categories appear together in the same video<br/>
        Shows the most common tag combinations across categories
      </small>
      {cooccurrencePairs.length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Tag 1 (Category)</th>
              <th>Tag 2 (Category)</th>
              <th>Co-occurrences</th>
            </tr>
          </thead>
          <tbody>
            {cooccurrencePairs.slice(0, 15).map((pair, index) => (
              <tr key={index}>
                <td><span className="badge bg-primary">{pair.tag1}</span><br/><small className="text-muted">({pair.category1})</small></td>
                <td><span className="badge bg-secondary">{pair.tag2}</span><br/><small className="text-muted">({pair.category2})</small></td>
                <td className="text-center">{pair.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No co-occurrences found.</p>
      )}
    </div>
  );
};

const renderCoderAgreementAnalysis = (stats, results) => {
  const coders = Object.keys(stats.coderStats);
  if (coders.length < 2) {
    return <p className="text-muted">Need at least 2 coders for agreement analysis.</p>;
  }
  
  // Group results by video_id
  const videoResults = {};
  results.forEach(result => {
    if (!videoResults[result.video_id]) {
      videoResults[result.video_id] = [];
    }
    videoResults[result.video_id].push(result);
  });
  
  // Calculate agreement metrics
  let totalTagComparisons = 0;
  let totalTagAgreements = 0;
  const categoryTagAgreements = {};
  
  Object.values(videoResults).forEach(videoResult => {
    if (videoResult.length >= 2) {
      for (let i = 0; i < videoResult.length; i++) {
        for (let j = i + 1; j < videoResult.length; j++) {
          const coder1 = videoResult[i];
          const coder2 = videoResult[j];
          
          if (coder1.status !== 'excluded' && coder2.status !== 'excluded') {
            // Parse categories and tags for both coders
            const parseCategoriesAndTags = (categoriesStr) => {
              if (!categoriesStr || !categoriesStr.trim()) return {};
              const result = {};
              categoriesStr.split(';').forEach(pair => {
                const trimmedPair = pair.trim();
                if (!trimmedPair) return;
                const colonIndex = trimmedPair.indexOf(':');
                if (colonIndex > -1) {
                  const category = trimmedPair.substring(0, colonIndex).trim();
                  const tags = trimmedPair.substring(colonIndex + 1).trim();
                  if (category && tags) {
                    result[category] = tags.split(',').map(t => t.trim()).filter(t => t);
                  }
                }
              });
              return result;
            };
            
            const coder1Data = parseCategoriesAndTags(coder1.categories);
            const coder2Data = parseCategoriesAndTags(coder2.categories);
            
            // Compare tags within each category
            const allCategories = new Set([...Object.keys(coder1Data), ...Object.keys(coder2Data)]);
            
            allCategories.forEach(category => {
              const tags1 = coder1Data[category] || [];
              const tags2 = coder2Data[category] || [];
              
              // Only compare if both coders have tags for this category
              if (tags1.length > 0 && tags2.length > 0) {
                // Count tag comparisons and agreements
                const totalTags = Math.max(tags1.length, tags2.length);
                totalTagComparisons += totalTags;
                
                // Count matching tags
                const matchingTags = tags1.filter(tag => tags2.includes(tag));
                totalTagAgreements += matchingTags.length;
                
                // Track category-specific agreements
                if (!categoryTagAgreements[category]) {
                  categoryTagAgreements[category] = { comparisons: 0, agreements: 0 };
                }
                categoryTagAgreements[category].comparisons += totalTags;
                categoryTagAgreements[category].agreements += matchingTags.length;
              }
            });
          }
        }
      }
    }
  });
  
  const overallAgreement = totalTagComparisons > 0 ? (totalTagAgreements / totalTagComparisons * 100) : 0;
  
  return (
    <div>
      <h6>Inter-Coder Agreement (Tag-Level)</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Method:</strong> Tag-level agreement within categories<br/>
        <strong>Calculation:</strong> Agreement = (matching tag selections) / (total tag selections compared)<br/>
        <strong>Process:</strong> For each video, compare tag selections between all coder pairs within each category<br/>
        <strong>Example:</strong> If Coder A selects "News/Current Events, Lifestyle" for Content Type and Coder B selects "News/Current Events, Entertainment", 
        the agreement is 1/2 = 50% (1 matching tag out of 2 total unique tags)<br/>
        <strong>Note:</strong> Only compares categories where both coders selected at least one tag
      </small>
      <div className="mb-3">
        <strong>Overall Agreement:</strong> {overallAgreement.toFixed(1)}%
        <div className="progress mt-1" style={{ height: '20px' }}>
          <div 
            className={`progress-bar ${overallAgreement > 80 ? 'bg-success' : 
              overallAgreement > 60 ? 'bg-warning' : 'bg-danger'}`}
            style={{ width: `${Math.min(overallAgreement, 100)}%` }}
          />
        </div>
        <small className="text-muted">
          Based on {totalTagComparisons} tag comparisons between {coders.length} coders across {Object.keys(videoResults).length} videos
        </small>
      </div>
      
      <h6>Category-Specific Tag Agreement</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Breakdown:</strong> Shows agreement rates for each category separately<br/>
        <strong>Interpretation:</strong> Higher rates indicate better coder consistency within that category<br/>
        <strong>Use:</strong> Identify which categories have the most/least consistent coding across coders
      </small>
      {Object.keys(categoryTagAgreements).length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Category</th>
              <th>Tag Agreements</th>
              <th>Rate</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryTagAgreements)
              .sort(([,a], [,b]) => (b.agreements / b.comparisons) - (a.agreements / a.comparisons))
              .slice(0, 5)
              .map(([category, data]) => {
                const rate = (data.agreements / data.comparisons) * 100;
                let interpretation = '';
                if (rate >= 80) interpretation = 'Excellent agreement';
                else if (rate >= 60) interpretation = 'Good agreement';
                else if (rate >= 40) interpretation = 'Moderate agreement';
                else interpretation = 'Low agreement';
                
                return (
                  <tr key={category}>
                    <td><strong>{category}</strong></td>
                    <td className="text-center">{data.agreements} / {data.comparisons}</td>
                    <td className="text-center">
                      <span className={`badge ${rate >= 80 ? 'bg-success' : rate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                        {rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <small className="text-muted">{interpretation}</small>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No tag agreements found.</p>
      )}
      
      <div className="mt-3">
        <h6>Agreement Interpretation Guide</h6>
        <small className="text-muted">
          <strong>80%+ (Excellent):</strong> Coders are very consistent in their tag selections<br/>
          <strong>60-79% (Good):</strong> Coders show good agreement with some variation<br/>
          <strong>40-59% (Moderate):</strong> Moderate agreement, may need coding guidelines review<br/>
          <strong>Below 40% (Low):</strong> Poor agreement, coding criteria may need clarification<br/>
          <strong>Factors affecting agreement:</strong> Tag ambiguity, coding complexity, coder experience, category definitions
        </small>
      </div>
    </div>
  );
};

const renderDistributionAnalysis = (stats, results) => {
  // Calculate coding completeness statistics
  const validResults = results.filter(r => r.status !== 'excluded');
  const totalVideos = validResults.length;
  const totalExpectedCategories = totalVideos * Object.keys(stats.categoryStats).length;
  
  // Count how many categories were actually coded
  let totalCodedCategories = 0;
  validResults.forEach(result => {
    if (result.categories && result.categories.trim()) {
      const categoryCount = result.categories.split(';').filter(pair => {
        const trimmedPair = pair.trim();
        if (!trimmedPair) return false;
        const colonIndex = trimmedPair.indexOf(':');
        if (colonIndex > -1) {
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          return tags && tags.length > 0;
        }
        return false;
      }).length;
      totalCodedCategories += categoryCount;
    }
  });
  
  const completenessRate = totalExpectedCategories > 0 ? (totalCodedCategories / totalExpectedCategories * 100) : 0;
  
  // Calculate tag diversity statistics with category information
  const allTags = Object.keys(stats.tagStats);
  const tagUsageCounts = Object.values(stats.tagStats);
  const usedTags = tagUsageCounts.filter(count => count > 0).length;
  const tagDiversityRate = allTags.length > 0 ? (usedTags / allTags.length * 100) : 0;
  
  // Build tag-to-category mapping
  const tagWithCategory = new Map(); // tag -> category
  validResults.forEach(result => {
    if (result.categories && result.categories.trim()) {
      result.categories.split(';').forEach(pair => {
        const trimmedPair = pair.trim();
        if (!trimmedPair) return;
        const colonIndex = trimmedPair.indexOf(':');
        if (colonIndex > -1) {
          const category = trimmedPair.substring(0, colonIndex).trim();
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          if (tags) {
            tags.split(',').forEach(tag => {
              const cleanTag = tag.trim();
              tagWithCategory.set(cleanTag, category);
            });
          }
        }
      });
    }
  });
  
  // Calculate average tags per video
  let totalTagsSelected = 0;
  validResults.forEach(result => {
    if (result.categories && result.categories.trim()) {
      result.categories.split(';').forEach(pair => {
        const trimmedPair = pair.trim();
        if (!trimmedPair) return;
        const colonIndex = trimmedPair.indexOf(':');
        if (colonIndex > -1) {
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          if (tags) {
            totalTagsSelected += tags.split(',').map(t => t.trim()).filter(t => t).length;
          }
        }
      });
    }
  });
  
  const avgTagsPerVideo = totalVideos > 0 ? (totalTagsSelected / totalVideos) : 0;
  
  // Calculate most/least used tags with categories
  const sortedTags = Object.entries(stats.tagStats)
    .sort(([,a], [,b]) => b - a)
    .filter(([,count]) => count > 0);
  
  const mostUsedTags = sortedTags.slice(0, 5).map(([tag, count]) => ({
    tag,
    count,
    category: tagWithCategory.get(tag)
  }));
  const leastUsedTags = sortedTags.slice(-5).reverse().map(([tag, count]) => ({
    tag,
    count,
    category: tagWithCategory.get(tag)
  }));
  
  return (
    <div>
      <h6>Coding Quality & Diversity Analysis</h6>
      
      <div className="row">
        <div className="col-6">
          <h6 className="text-primary">Coding Completeness</h6>
          <small className="text-muted mb-2 d-block">
            Measures how thoroughly videos are coded across all categories
          </small>
          <Table striped bordered hover size="sm">
            <tbody>
              <tr>
                <td>Completeness Rate</td>
                <td className="text-center">{completenessRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Coded Categories</td>
                <td className="text-center">{totalCodedCategories} / {totalExpectedCategories}</td>
              </tr>
              <tr>
                <td>Average Tags per Video</td>
                <td className="text-center">{avgTagsPerVideo.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Total Tags Selected</td>
                <td className="text-center">{totalTagsSelected}</td>
              </tr>
            </tbody>
          </Table>
        </div>
        
        <div className="col-6">
          <h6 className="text-success">Tag Diversity & Usage</h6>
          <small className="text-muted mb-2 d-block">
            Measures how well the tag vocabulary is being utilized across categories
          </small>
          <Table striped bordered hover size="sm">
            <tbody>
              <tr>
                <td>Tag Diversity Rate</td>
                <td className="text-center">{tagDiversityRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Tags Used</td>
                <td className="text-center">{usedTags} / {allTags.length}</td>
              </tr>
              <tr>
                <td>Most Used Tags</td>
                <td className="text-center">
                  {mostUsedTags.length > 0 ? (
                    <div>
                      {mostUsedTags.map((item, index) => (
                        <div key={index} className="mb-1">
                          <span className="badge bg-primary">{item.tag}</span>
                          <small className="text-muted">({item.category}) - {item.count}</small>
                        </div>
                      ))}
                    </div>
                  ) : 'None'}
                </td>
              </tr>
              <tr>
                <td>Least Used Tags</td>
                <td className="text-center">
                  {leastUsedTags.length > 0 ? (
                    <div>
                      {leastUsedTags.map((item, index) => (
                        <div key={index} className="mb-1">
                          <span className="badge bg-secondary">{item.tag}</span>
                          <small className="text-muted">({item.category}) - {item.count}</small>
                        </div>
                      ))}
                    </div>
                  ) : 'None'}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
      
      <div className="mt-3">
        <h6>Quality Metrics</h6>
        <small className="text-muted">
          <strong>Coding Completeness:</strong> Percentage of expected category-video combinations that were actually coded<br/>
          <strong>Tag Diversity:</strong> Percentage of available tags that were actually used across all categories<br/>
          <strong>Average Tags per Video:</strong> Measures coding density and thoroughness<br/>
          <strong>Most/Least Used Tags:</strong> Identifies popular and underutilized tags with their categories<br/>
          <strong>Interpretation:</strong> Higher completeness and diversity rates indicate better coding quality
        </small>
      </div>
    </div>
  );
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { project } = location.state || {};

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [coderFilter, setCoderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [resultsExpanded, setResultsExpanded] = useState(false);

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    return result;
  };

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/download-results?project=${project.slug}&format=text`);
      
      // Parse CSV data
      const csvText = response.data;
      const lines = csvText.split('\n');
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });

      setResults(data);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [project?.slug]);

  // Export functionality
  const handleExport = async () => {
    if (!project) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-results?project=${project.slug}&format=text`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.slug}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export results');
    }
  };

  // Filter and pagination logic
  const filteredResults = results ? results.filter(result => {
    const matchesSearch = !searchTerm || 
      result.video_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.coder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.notes && result.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.categories && result.categories.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    const matchesCoder = coderFilter === 'all' || result.coder === coderFilter;
    
    return matchesSearch && matchesStatus && matchesCoder;
  }) : [];

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!project?.slug) {
      setError('No project selected');
      setLoading(false);
      return;
    }

    loadResults();
  }, [project, loadResults]);

  const calculateStats = () => {
    if (!results) return null;

    // Get unique video count (not total results)
    const uniqueVideos = new Set(results.map(r => r.video_id)).size;
    
    const stats = {
      totalVideos: uniqueVideos,
      excludedVideos: results.filter(r => r.status === 'excluded').length,
      submittedVideos: results.filter(r => r.status === 'submitted').length,
      savedVideos: results.filter(r => r.status === 'saved').length,
      categoryStats: {},
      tagStats: {},
      coderStats: {}
    };

    // Calculate category and tag statistics (excluding excluded videos)
    const validResults = results.filter(r => r.status !== 'excluded');
    
    // First pass: collect all categories and their associated tags from all results
    const categoryTagMap = new Map(); // category -> Set of tags
    
    results.forEach(result => {
      if (result.categories && result.categories.trim()) {
        const categoryPairs = result.categories.split(';');
        categoryPairs.forEach(pair => {
          const trimmedPair = pair.trim();
          if (!trimmedPair) return;
          
          const colonIndex = trimmedPair.indexOf(':');
          if (colonIndex === -1) return;
          
          const category = trimmedPair.substring(0, colonIndex).trim();
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          
          if (category && tags) {
            if (!categoryTagMap.has(category)) {
              categoryTagMap.set(category, new Set());
            }
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
            tagList.forEach(tag => categoryTagMap.get(category).add(tag));
          }
        });
      }
    });
    
    // Initialize all categories with their correct tags
    categoryTagMap.forEach((tags, category) => {
      if (!stats.categoryStats[category]) {
        stats.categoryStats[category] = { count: 0, tags: {} };
      }
      tags.forEach(tag => {
        stats.categoryStats[category].tags[tag] = 0;
      });
    });
    
    // Count by coder (process all results, not just valid ones)
    results.forEach(result => {
      const coder = result.coder;
      if (!stats.coderStats[coder]) {
        stats.coderStats[coder] = { total: 0, submitted: 0, saved: 0, excluded: 0 };
      }
      stats.coderStats[coder].total++;
      if (result.status === 'excluded') {
        stats.coderStats[coder].excluded++;
      } else if (result.status === 'submitted') {
        stats.coderStats[coder].submitted++;
      } else {
        stats.coderStats[coder].saved++;
      }
    });

    // Process valid results for category/tag statistics
    validResults.forEach(result => {

      // Parse categories and tags
      if (result.categories && result.categories.trim()) {
        const categoryPairs = result.categories.split(';');
        categoryPairs.forEach(pair => {
          const trimmedPair = pair.trim();
          if (!trimmedPair) return;
          
          const colonIndex = trimmedPair.indexOf(':');
          if (colonIndex === -1) return;
          
          const category = trimmedPair.substring(0, colonIndex).trim();
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          
          if (category && tags) {
            // Count category
            if (!stats.categoryStats[category]) {
              stats.categoryStats[category] = { count: 0, tags: {} };
            }
            stats.categoryStats[category].count++;

            // Count individual tags
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
            tagList.forEach(tag => {
              if (!stats.categoryStats[category].tags[tag]) {
                stats.categoryStats[category].tags[tag] = 0;
              }
              stats.categoryStats[category].tags[tag]++;
              
              // Global tag stats
              if (!stats.tagStats[tag]) {
                stats.tagStats[tag] = 0;
              }
              stats.tagStats[tag]++;
            });
          }
        });
      }
    });

    return stats;
  };

  const downloadStats = () => {
    if (!results) return;

    const stats = calculateStats();
    const validVideos = (stats.totalVideos * Object.keys(stats.coderStats).length) - stats.excludedVideos;
    
    // Generate comprehensive analysis report
    const reportSections = [
      // Overview Statistics
      'OVERVIEW STATISTICS',
      'Metric,Value,Percentage',
      `Total Videos,${stats.totalVideos},100%`,
      `Total Results,${stats.totalVideos * Object.keys(stats.coderStats).length},100%`,
      `Submitted Results,${stats.submittedVideos},${((stats.submittedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}%`,
      `Saved Results,${stats.savedVideos},${((stats.savedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}%`,
      `Excluded Results,${stats.excludedVideos},${((stats.excludedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}%`,
      '',
      
      // Coder Performance
      'CODER PERFORMANCE',
      'Coder,Total Videos,Submitted,Saved,Excluded,Completion Rate (%)',
      ...Object.entries(stats.coderStats).map(([coder, data]) => 
        `${coder},${data.total},${data.submitted},${data.saved},${data.excluded},${(((data.submitted + data.excluded) / data.total) * 100).toFixed(1)}`
      ),
      '',
      
      // Category Statistics
      'CATEGORY STATISTICS',
      'Category,Count,Percentage of Valid Videos',
      ...Object.entries(stats.categoryStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([category, data]) => 
          `${category},${data.count},${((data.count / validVideos) * 100).toFixed(1)}%`
        ),
      '',
      
      // Tag Statistics
      'TAG STATISTICS',
      'Tag,Count,Percentage of Valid Videos',
      ...Object.entries(stats.tagStats)
        .sort(([,a], [,b]) => b - a)
        .map(([tag, count]) => 
          `${tag},${count},${((count / validVideos) * 100).toFixed(1)}%`
        ),
      '',
      
      // Category-Tag Breakdown
      'CATEGORY-TAG BREAKDOWN',
      ...Object.entries(stats.categoryStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .flatMap(([category, data]) => [
          `${category} (${data.count} videos)`,
          'Tag,Count,Percentage of Category',
          ...Object.entries(data.tags)
            .sort(([,a], [,b]) => b - a)
            .map(([tag, count]) => 
              `${tag},${count},${((count / data.count) * 100).toFixed(1)}%`
            ),
          ''
        ]),
      
      // Cross-Category Tag Correlations
      'CROSS-CATEGORY TAG CORRELATIONS',
      'Tag 1,Tag 2,Correlation,Strength',
      ...(() => {
        const correlations = [];
        const tagWithCategory = new Map();
        
        // Build tag-to-category mapping
        results.forEach(r => {
          if (r.status !== 'excluded' && r.categories) {
            const categories = r.categories.split(';');
            categories.forEach(pair => {
              const colonIndex = pair.indexOf(':');
              if (colonIndex > -1) {
                const category = pair.substring(0, colonIndex).trim();
                const tagsStr = pair.substring(colonIndex + 1).trim();
                if (tagsStr) {
                  tagsStr.split(',').forEach(tag => {
                    const cleanTag = tag.trim();
                    tagWithCategory.set(cleanTag, category);
                  });
                }
              }
            });
          }
        });
        
        // Calculate correlations
        const allTags = Array.from(tagWithCategory.keys());
        for (let i = 0; i < allTags.length; i++) {
          for (let j = i + 1; j < allTags.length; j++) {
            const tag1 = allTags[i];
            const tag2 = allTags[j];
            
            const tag1Vector = results.map(r => {
              if (r.status === 'excluded' || !r.categories) return 0;
              const videoTags = [];
              r.categories.split(';').forEach(pair => {
                const colonIndex = pair.indexOf(':');
                if (colonIndex > -1) {
                  const tagsStr = pair.substring(colonIndex + 1).trim();
                  if (tagsStr) {
                    videoTags.push(...tagsStr.split(',').map(t => t.trim()));
                  }
                }
              });
              return videoTags.includes(tag1) ? 1 : 0;
            });
            
            const tag2Vector = results.map(r => {
              if (r.status === 'excluded' || !r.categories) return 0;
              const videoTags = [];
              r.categories.split(';').forEach(pair => {
                const colonIndex = pair.indexOf(':');
                if (colonIndex > -1) {
                  const tagsStr = pair.substring(colonIndex + 1).trim();
                  if (tagsStr) {
                    videoTags.push(...tagsStr.split(',').map(t => t.trim()));
                  }
                }
              });
              return videoTags.includes(tag2) ? 1 : 0;
            });
            
            const correlation = calculateCorrelation(tag1Vector, tag2Vector);
            if (Math.abs(correlation) > 0.01) {
              const strength = Math.abs(correlation) > 0.7 ? 'Strong' : 
                             Math.abs(correlation) > 0.5 ? 'Moderate' : 
                             Math.abs(correlation) > 0.1 ? 'Weak' : 'None';
              correlations.push({
                tag1,
                tag2,
                correlation,
                strength
              });
            }
          }
        }
        
        return correlations
          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
          .slice(0, 20)
          .map(corr => `${corr.tag1} (${tagWithCategory.get(corr.tag1)}),${corr.tag2} (${tagWithCategory.get(corr.tag2)}),${corr.correlation.toFixed(3)},${corr.strength}`);
      })(),
      '',
      
      // Tag Co-occurrences
      'TAG CO-OCCURRENCES',
      'Tag 1,Tag 2,Co-occurrences',
      ...(() => {
        const allTags = new Set();
        const tagWithCategory = new Map();
        const tagCooccurrence = {};
        
        // Collect all tags
        results.forEach(result => {
          if (result.categories && result.status !== 'excluded') {
            const categories = result.categories.split(';');
            categories.forEach(pair => {
              const colonIndex = pair.indexOf(':');
              if (colonIndex > -1) {
                const category = pair.substring(0, colonIndex).trim();
                const tagsStr = pair.substring(colonIndex + 1).trim();
                if (tagsStr) {
                  tagsStr.split(',').forEach(tag => {
                    const cleanTag = tag.trim();
                    allTags.add(cleanTag);
                    tagWithCategory.set(cleanTag, category);
                  });
                }
              }
            });
          }
        });
        
        // Initialize co-occurrence matrix
        allTags.forEach(tag1 => {
          tagCooccurrence[tag1] = {};
          allTags.forEach(tag2 => {
            tagCooccurrence[tag1][tag2] = 0;
          });
        });
        
        // Calculate co-occurrences
        results.forEach(result => {
          if (result.categories && result.status !== 'excluded') {
            const tags = result.categories.split(';').flatMap(pair => {
              const colonIndex = pair.indexOf(':');
              if (colonIndex === -1) return [];
              const tags = pair.substring(colonIndex + 1).trim();
              return tags.split(',').map(t => t.trim()).filter(t => t);
            });
            
            tags.forEach(tag1 => {
              tags.forEach(tag2 => {
                if (tag1 !== tag2) {
                  tagCooccurrence[tag1][tag2]++;
                }
              });
            });
          }
        });
        
        // Find top co-occurring pairs
        const cooccurrencePairs = [];
        allTags.forEach(tag1 => {
          allTags.forEach(tag2 => {
            if (tag1 < tag2 && tagCooccurrence[tag1][tag2] > 0) {
              cooccurrencePairs.push({
                tag1,
                tag2,
                count: tagCooccurrence[tag1][tag2]
              });
            }
          });
        });
        
        return cooccurrencePairs
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
          .map(pair => `${pair.tag1} (${tagWithCategory.get(pair.tag1)}),${pair.tag2} (${tagWithCategory.get(pair.tag2)}),${pair.count}`);
      })(),
      '',
      
      // Inter-Coder Agreement
      'INTER-CODER AGREEMENT',
      ...(() => {
        const coders = Object.keys(stats.coderStats);
        if (coders.length < 2) return ['Need at least 2 coders for agreement analysis'];
        
        const videoResults = {};
        results.forEach(result => {
          if (!videoResults[result.video_id]) {
            videoResults[result.video_id] = [];
          }
          videoResults[result.video_id].push(result);
        });
        
        let totalTagComparisons = 0;
        let totalTagAgreements = 0;
        const categoryTagAgreements = {};
        
        Object.values(videoResults).forEach(videoResult => {
          if (videoResult.length >= 2) {
            for (let i = 0; i < videoResult.length; i++) {
              for (let j = i + 1; j < videoResult.length; j++) {
                const coder1 = videoResult[i];
                const coder2 = videoResult[j];
                
                if (coder1.status !== 'excluded' && coder2.status !== 'excluded') {
                  const parseCategoriesAndTags = (categoriesStr) => {
                    if (!categoriesStr || !categoriesStr.trim()) return {};
                    const result = {};
                    categoriesStr.split(';').forEach(pair => {
                      const trimmedPair = pair.trim();
                      if (!trimmedPair) return;
                      const colonIndex = trimmedPair.indexOf(':');
                      if (colonIndex > -1) {
                        const category = trimmedPair.substring(0, colonIndex).trim();
                        const tags = trimmedPair.substring(colonIndex + 1).trim();
                        if (category && tags) {
                          result[category] = tags.split(',').map(t => t.trim()).filter(t => t);
                        }
                      }
                    });
                    return result;
                  };
                  
                  const coder1Data = parseCategoriesAndTags(coder1.categories);
                  const coder2Data = parseCategoriesAndTags(coder2.categories);
                  
                  const allCategories = new Set([...Object.keys(coder1Data), ...Object.keys(coder2Data)]);
                  
                  allCategories.forEach(category => {
                    const tags1 = coder1Data[category] || [];
                    const tags2 = coder2Data[category] || [];
                    
                    if (tags1.length > 0 && tags2.length > 0) {
                      const totalTags = Math.max(tags1.length, tags2.length);
                      totalTagComparisons += totalTags;
                      
                      const matchingTags = tags1.filter(tag => tags2.includes(tag));
                      totalTagAgreements += matchingTags.length;
                      
                      if (!categoryTagAgreements[category]) {
                        categoryTagAgreements[category] = { comparisons: 0, agreements: 0 };
                      }
                      categoryTagAgreements[category].comparisons += totalTags;
                      categoryTagAgreements[category].agreements += matchingTags.length;
                    }
                  });
                }
              }
            }
          }
        });
        
        const overallAgreement = totalTagComparisons > 0 ? (totalTagAgreements / totalTagComparisons * 100) : 0;
        
        return [
          `Overall Agreement,${overallAgreement.toFixed(1)}%,${totalTagComparisons} comparisons`,
          '',
          'Category-Specific Agreement',
          'Category,Agreements,Comparisons,Rate (%)',
          ...Object.entries(categoryTagAgreements)
            .sort(([,a], [,b]) => (b.agreements / b.comparisons) - (a.agreements / a.comparisons))
            .map(([category, data]) => 
              `${category},${data.agreements},${data.comparisons},${((data.agreements / data.comparisons) * 100).toFixed(1)}`
            )
        ];
      })(),
      '',
      
      // Distribution Analysis
      'DISTRIBUTION ANALYSIS',
      ...(() => {
        const validResults = results.filter(r => r.status !== 'excluded');
        const totalVideos = validResults.length;
        const totalExpectedCategories = totalVideos * Object.keys(stats.categoryStats).length;
        
        let totalCodedCategories = 0;
        validResults.forEach(result => {
          if (result.categories && result.categories.trim()) {
            const categoryCount = result.categories.split(';').filter(pair => {
              const trimmedPair = pair.trim();
              if (!trimmedPair) return false;
              const colonIndex = trimmedPair.indexOf(':');
              if (colonIndex > -1) {
                const tags = trimmedPair.substring(colonIndex + 1).trim();
                return tags && tags.length > 0;
              }
              return false;
            }).length;
            totalCodedCategories += categoryCount;
          }
        });
        
        const completenessRate = totalExpectedCategories > 0 ? (totalCodedCategories / totalExpectedCategories * 100) : 0;
        
        let totalTagsSelected = 0;
        validResults.forEach(result => {
          if (result.categories && result.categories.trim()) {
            result.categories.split(';').forEach(pair => {
              const trimmedPair = pair.trim();
              if (!trimmedPair) return;
              const colonIndex = trimmedPair.indexOf(':');
              if (colonIndex > -1) {
                const tags = trimmedPair.substring(colonIndex + 1).trim();
                if (tags) {
                  totalTagsSelected += tags.split(',').map(t => t.trim()).filter(t => t).length;
                }
              }
            });
          }
        });
        
        const avgTagsPerVideo = totalVideos > 0 ? totalTagsSelected / totalVideos : 0;
        const usedTags = Object.keys(stats.tagStats).filter(tag => stats.tagStats[tag] > 0).length;
        const tagDiversityRate = Object.keys(stats.tagStats).length > 0 ? (usedTags / Object.keys(stats.tagStats).length * 100) : 0;
        
        const sortedTags = Object.entries(stats.tagStats)
          .sort(([,a], [,b]) => b - a)
          .filter(([,count]) => count > 0);
        
        const mostUsedTags = sortedTags.slice(0, 5);
        const leastUsedTags = sortedTags.slice(-5).reverse();
        
        return [
          'Metric,Value',
          `Coding Completeness Rate,${completenessRate.toFixed(1)}%`,
          `Coded Categories,${totalCodedCategories} / ${totalExpectedCategories}`,
          `Average Tags per Video,${avgTagsPerVideo.toFixed(1)}`,
          `Total Tags Selected,${totalTagsSelected}`,
          `Tag Diversity Rate,${tagDiversityRate.toFixed(1)}%`,
          `Tags Used,${usedTags} / ${Object.keys(stats.tagStats).length}`,
          '',
          'Most Used Tags',
          'Tag,Count',
          ...mostUsedTags.map(([tag, count]) => `${tag},${count}`),
          '',
          'Least Used Tags',
          'Tag,Count',
          ...leastUsedTags.map(([tag, count]) => `${tag},${count}`)
        ];
      })()
    ];
    
    const csvContent = reportSections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}_comprehensive_analysis.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderBarChart = (data, maxValue, height = 200) => {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'end', gap: '8px', padding: '10px 0' }}>
        {Object.entries(data)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8) // Show top 8 items
          .map(([label, value]) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${(value / maxValue) * (height - 60)}px`,
                  backgroundColor: '#007bff',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px'
                }}
              />
              <div style={{ 
                fontSize: '0.7rem', 
                textAlign: 'center', 
                marginTop: '4px', 
                wordBreak: 'break-word',
                lineHeight: '1.2',
                height: '40px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
                {label.length > 12 ? label.substring(0, 10) + '...' : label}
              </div>
            </div>
          ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading results...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="text-center text-danger">{error}</div>
        <Button variant="outline-secondary" onClick={() => navigate('/')} className="mt-3">
          <ArrowLeft className="me-2" />Back to Home
        </Button>
      </Container>
    );
  }

  const stats = calculateStats();
  if (!stats) return null;

      const validVideos = (stats.totalVideos * Object.keys(stats.coderStats).length) - stats.excludedVideos;

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              <ArrowLeft className="me-2" />Back to Home
            </Button>
            <h2 className="mb-0">Results Analysis: {project?.name}</h2>
            <div className="d-flex gap-2">
              <Button variant="success" onClick={handleExport}>
                <Download className="me-2" />Export Results
              </Button>
              <Button variant="info" onClick={downloadStats}>
                <Download className="me-2" />Download Statistics
              </Button>
            </div>
          </div>
        </Col>
      </Row>



      {/* Overview Statistics and Coder Performance */}
      <Row className="mb-4">
        <Col md={6}>
          <Row>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-primary">{stats.totalVideos}</h3>
                  <Card.Title>Total Videos</Card.Title>
                  <small className="text-muted">
                    {Object.keys(stats.coderStats).length} coders
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-success">{stats.submittedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Submitted</Card.Title>
                  <small className="text-muted">
                    {((stats.submittedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-warning">{stats.savedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Saved</Card.Title>
                  <small className="text-muted">
                    {((stats.savedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-danger">{stats.excludedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Excluded</Card.Title>
                  <small className="text-muted">
                    {((stats.excludedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>Coder Performance</Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th className="text-center">Coder</th>
                    <th className="text-center" width="12%">Total</th>
                    <th className="text-center" width="12%">Submitted</th>
                    <th className="text-center" width="12%">Saved</th>
                    <th className="text-center" width="12%">Excluded</th>
                    <th className="text-center" width="20%">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.coderStats).map(([coder, data]) => (
                    <tr key={coder}>
                      <td><strong>{coder}</strong></td>
                      <td className="text-center">{data.total}</td>
                      <td className="text-center text-success">{data.submitted}</td>
                      <td className="text-center text-warning">{data.saved}</td>
                      <td className="text-center text-danger">{data.excluded}</td>
                      <td className="text-center">
                        <span className="fw-semibold" style={{ color: (data.submitted + data.excluded) > 0 ? '#198754' : '#ffc107' }}>
                          {(((data.submitted + data.excluded) / data.total) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Table with Pagination */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header 
              style={{ cursor: 'pointer' }}
              onClick={() => setResultsExpanded(!resultsExpanded)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <BarChart className="me-2" />
                  Results Table ({filteredResults.length} entries)
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary">
                    {filteredResults.length} results
                  </Badge>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCoderFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <span className="text-muted">
                    {resultsExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </Card.Header>
            {resultsExpanded && (
              <Card.Body>
                {/* Filter Controls */}
                <Row className="mb-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text>
                        <Search />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search videos, coders, notes, or categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="submitted">Submitted</option>
                      <option value="saved">Saved</option>
                      <option value="excluded">Excluded</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={coderFilter}
                      onChange={(e) => setCoderFilter(e.target.value)}
                    >
                      <option value="all">All Coders</option>
                      {results && Object.keys(stats.coderStats).map(coder => (
                        <option key={coder} value={coder}>{coder}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <div className="d-flex justify-content-center">
                      <Filter className="me-2" />
                      <small className="text-muted">Filters Active</small>
                    </div>
                  </Col>
                </Row>

                {paginatedResults.length > 0 ? (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Video ID</th>
                          <th>Coder</th>
                          <th>Status</th>
                          <th>Categories</th>
                          <th>Notes</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResults.map((result, index) => (
                          <tr key={`${result.video_id}-${result.coder}`}>
                            <td><strong>{result.video_id}</strong></td>
                            <td>{result.coder}</td>
                            <td>
                              <Badge 
                                bg={
                                  result.status === 'submitted' ? 'success' : 
                                  result.status === 'saved' ? 'warning' : 
                                  result.status === 'excluded' ? 'danger' : 'secondary'
                                }
                              >
                                {result.status}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {result.categories || 'No categories'}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {result.notes || 'No notes'}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'N/A'}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted py-4">
                    No results match your current filters.
                  </div>
                )}
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      {/* Detailed Category Breakdown */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <BarChart className="me-2" />
              Detailed Category Breakdown
            </Card.Header>
            <Card.Body>
              <Row>
                {Object.entries(stats.categoryStats)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .map(([category, data]) => (
                    <Col md={6} key={category} className="mb-4">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0 fw-bold">{category}</h5>
                          <div className="text-muted">
                            {data.count} / {validVideos} videos ({((data.count / validVideos) * 100).toFixed(1)}%)
                          </div>
                        </div>
                        
                        {/* Category Bar Chart */}
                        {Object.keys(data.tags).length > 0 && (
                          <div className="mb-3">
                            {renderBarChart(
                              data.tags,
                              Math.max(...Object.values(data.tags)),
                              120
                            )}
                          </div>
                        )}
                        
                        {/* Tags Table */}
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th className="text-center">Tag</th>
                              <th className="text-center" width="25%">Count</th>
                              <th className="text-center" width="25%">Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(data.tags)
                              .sort(([,a], [,b]) => b - a)
                              .map(([tag, count]) => (
                                <tr key={tag}>
                                  <td>
                                    <strong>{tag}</strong>
                                  </td>
                                  <td className="text-center">{count} / {data.count}</td>
                                  <td className="text-center">{((count / data.count) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                  ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Statistical Analysis */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <GraphUp className="me-2" />
              Advanced Statistical Analysis
            </Card.Header>
            <Card.Body>
              <Row>
                {/* Correlation Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <ArrowLeftRight className="me-2" />
                      Category-Tag Correlations
                    </Card.Header>
                    <Card.Body>
                      {renderCorrelationAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Co-occurrence Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <Link className="me-2" />
                      Tag Co-occurrence Matrix
                    </Card.Header>
                    <Card.Body>
                      {renderCooccurrenceAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Coder Agreement Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <People className="me-2" />
                      Inter-Coder Agreement
                    </Card.Header>
                    <Card.Body>
                      {renderCoderAgreementAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Distribution Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <BarChart className="me-2" />
                      Distribution Statistics
                    </Card.Header>
                    <Card.Body>
                      {renderDistributionAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
